import type { ParsedCurlRequest } from "../parser";

const STANDARD_METHODS = new Set(["get", "post", "put", "patch", "delete", "head", "options"]);

function pythonString(value: string): string {
  return `"${value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")}"`;
}

function pad(level: number): string {
  return " ".repeat(level * 4);
}

function pythonValue(value: unknown, level: number): string {
  if (value === null) return "None";
  if (typeof value === "boolean") return value ? "True" : "False";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return pythonString(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value.map((item) => `${pad(level + 1)}${pythonValue(item, level + 1)},`);
    return `[\n${items.join("\n")}\n${pad(level)}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return "{}";
  const items = entries.map(
    ([key, entry]) => `${pad(level + 1)}${pythonString(key)}: ${pythonValue(entry, level + 1)},`,
  );
  return `{\n${items.join("\n")}\n${pad(level)}}`;
}

export function generatePython(request: ParsedCurlRequest): string {
  const headers = Object.entries(request.headers);
  const method = request.method.toLowerCase();
  const isStandardMethod = STANDARD_METHODS.has(method);

  const lines: string[] = ["import requests", "", `url = ${pythonString(request.url)}`];

  let dataArgument: string | null = null;
  let parsedJson: unknown = null;
  let hasParsedJson = false;
  if (request.data != null) {
    if (request.isJson) {
      try {
        parsedJson = JSON.parse(request.data);
        hasParsedJson = true;
      } catch {
        hasParsedJson = false;
      }
    }
    if (hasParsedJson) {
      lines.push("", `json_data = ${pythonValue(parsedJson, 0)}`);
      dataArgument = "json=json_data";
    } else {
      lines.push("", `data = ${pythonString(request.data)}`);
      dataArgument = "data=data";
    }
  }

  if (headers.length > 0) {
    lines.push("", `headers = ${pythonValue(Object.fromEntries(headers), 0)}`);
  }

  const argumentsList: string[] = ["url"];
  if (headers.length > 0) argumentsList.push("headers=headers");
  if (dataArgument) argumentsList.push(dataArgument);
  if (request.auth) {
    argumentsList.push(`auth=(${pythonString(request.auth.user)}, ${pythonString(request.auth.pass)})`);
  }

  const call = isStandardMethod
    ? `requests.${method}(${argumentsList.join(", ")})`
    : `requests.request(${pythonString(request.method)}, ${argumentsList.join(", ")})`;
  lines.push("", `response = ${call}`);

  const wantsJson = request.isJson && request.data != null && hasParsedJson;
  lines.push("", `print(response.${wantsJson ? "json" : "text"}())`);

  return lines.join("\n");
}
