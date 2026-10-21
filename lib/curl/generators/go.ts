import type { ParsedCurlRequest } from "../parser";

const METHOD_CONSTANTS: Record<string, string> = {
  GET: "http.MethodGet",
  POST: "http.MethodPost",
  PUT: "http.MethodPut",
  PATCH: "http.MethodPatch",
  DELETE: "http.MethodDelete",
  HEAD: "http.MethodHead",
  OPTIONS: "http.MethodOptions",
};

function goString(value: string): string {
  return JSON.stringify(value);
}

function goValue(value: unknown, level: number): string {
  if (value === null) return "nil";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return goString(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]any{}";
    const items = value.map((item) => `${pad(level + 1)}${goValue(item, level + 1)},`);
    return `[]any{\n${items.join("\n")}\n${pad(level)}}`;
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return "map[string]any{}";
  const items = entries.map(
    ([key, entry]) => `${pad(level + 1)}${goString(key)}: ${goValue(entry, level + 1)},`,
  );
  return `map[string]any{\n${items.join("\n")}\n${pad(level)}}`;
}

function pad(level: number): string {
  return "\t".repeat(level);
}

export function generateGo(request: ParsedCurlRequest): string {
  const headers = Object.entries(request.headers);
  const hasAuthorizationHeader = headers.some(([name]) => name.toLowerCase() === "authorization");
  const method = METHOD_CONSTANTS[request.method] ?? goString(request.method);

  let parsedJson: unknown = null;
  let hasParsedJson = false;
  if (request.isJson && request.data != null) {
    try {
      parsedJson = JSON.parse(request.data);
      hasParsedJson = true;
    } catch {
      hasParsedJson = false;
    }
  }

  const imports = new Set<string>(["fmt", "io", "net/http"]);
  const lines: string[] = [];

  if (request.data != null && hasParsedJson) {
    imports.add("bytes");
    imports.add("encoding/json");
    lines.push(`\tpayload := ${goValue(parsedJson, 1)}`);
    lines.push("\tbody, err := json.Marshal(payload)");
    lines.push("\tif err != nil {");
    lines.push("\t\tpanic(err)");
    lines.push("\t}");
    lines.push("");
    lines.push(
      `\treq, err := http.NewRequest(${method}, ${goString(request.url)}, bytes.NewReader(body))`,
    );
  } else if (request.data != null) {
    imports.add("strings");
    lines.push(
      `\treq, err := http.NewRequest(${method}, ${goString(request.url)}, strings.NewReader(${goString(request.data)}))`,
    );
  } else {
    lines.push(`\treq, err := http.NewRequest(${method}, ${goString(request.url)}, nil)`);
  }
  lines.push("\tif err != nil {");
  lines.push("\t\tpanic(err)");
  lines.push("\t}");
  lines.push("");

  for (const [name, value] of headers) {
    lines.push(`\treq.Header.Set(${goString(name)}, ${goString(value)})`);
  }
  if (request.auth && !hasAuthorizationHeader) {
    lines.push(`\treq.SetBasicAuth(${goString(request.auth.user)}, ${goString(request.auth.pass)})`);
  }
  if (headers.length > 0 || (request.auth && !hasAuthorizationHeader)) {
    lines.push("");
  }

  lines.push("\tresp, err := http.DefaultClient.Do(req)");
  lines.push("\tif err != nil {");
  lines.push("\t\tpanic(err)");
  lines.push("\t}");
  lines.push("\tdefer resp.Body.Close()");
  lines.push("");
  lines.push("\tdata, err := io.ReadAll(resp.Body)");
  lines.push("\tif err != nil {");
  lines.push("\t\tpanic(err)");
  lines.push("\t}");
  lines.push("\tfmt.Println(string(data))");

  const importBlock = [...imports].sort().map((name) => `\t"${name}"`).join("\n");

  return ["package main", "", "import (", importBlock, ")", "", "func main() {", ...lines, "}", ""].join(
    "\n",
  );
}
