import type { ParsedCurlRequest } from "../parser";

function shellSingleQuoted(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function jsonItems(data: string): string[] | null {
  // HTTPie JSON items: key=value for strings, key:=value for raw JSON values.
  try {
    const parsed = JSON.parse(data);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    const items: string[] = [];
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") {
        items.push(`${key}=${shellSingleQuoted(value)}`);
      } else {
        items.push(`${key}:=${JSON.stringify(value)}`);
      }
    }
    return items;
  } catch {
    return null;
  }
}

export function generateHttpie(request: ParsedCurlRequest): string {
  const headers = Object.entries(request.headers);
  const isGet = request.method.toUpperCase() === "GET";
  const items = request.data != null && request.isJson ? jsonItems(request.data) : null;
  const usesItems = items !== null && items.length > 0;

  const parts: string[] = [];
  parts.push("http");
  if (!isGet) {
    parts.push(request.method.toUpperCase());
  }
  parts.push(shellSingleQuoted(request.url));

  for (const [name, value] of headers) {
    if (usesItems && name.toLowerCase() === "content-type") {
      // HTTPie sets Content-Type itself when JSON items are used.
      continue;
    }
    parts.push(`${name}:${shellSingleQuoted(value)}`);
  }

  if (request.auth) {
    parts.push(`--auth ${shellSingleQuoted(`${request.auth.user}:${request.auth.pass}`)}`);
  }

  if (request.data != null) {
    if (usesItems) {
      parts.push(...items!);
    } else {
      parts.push(`--raw ${shellSingleQuoted(request.data)}`);
    }
  }

  const singleLine = parts.join(" ");
  if (singleLine.length <= 100 || parts.length <= 3) {
    return singleLine;
  }
  return parts.map((part, index) => (index < parts.length - 1 ? `${part} \\` : part)).join("\n");
}
