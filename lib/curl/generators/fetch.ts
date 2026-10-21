import type { ParsedCurlRequest } from "../parser";

function jsString(value: string): string {
  return JSON.stringify(value);
}

function base64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function jsonLiteral(data: string): string | null {
  try {
    return JSON.stringify(JSON.parse(data), null, 2);
  } catch {
    return null;
  }
}

function indentBlock(block: string, spaces: number): string {
  const pad = " ".repeat(spaces);
  return block.split("\n").join(`\n${pad}`);
}

function renderEntries(entries: Array<[string, string]>, indent: string): string {
  const inner = `${indent}  `;
  const lines = entries.map(([key, value]) => `${inner}${jsString(key)}: ${jsString(value)},`);
  return `{\n${lines.join("\n")}\n${indent}}`;
}

export function generateFetch(request: ParsedCurlRequest): string {
  const headers: Array<[string, string]> = [];
  const hasAuthorizationHeader = Object.keys(request.headers).some(
    (name) => name.toLowerCase() === "authorization",
  );
  if (request.auth && !hasAuthorizationHeader) {
    const credentials = `${request.auth.user}:${request.auth.pass}`;
    headers.push(["Authorization", `Basic ${base64Utf8(credentials)}`]);
  }
  for (const [name, value] of Object.entries(request.headers)) {
    headers.push([name, value]);
  }

  const options: string[] = [];
  if (request.method !== "GET") {
    options.push(`  method: ${jsString(request.method)},`);
  }
  if (headers.length > 0) {
    options.push(`  headers: ${renderEntries(headers, "  ")},`);
  }
  if (request.data != null) {
    const literal = request.isJson ? jsonLiteral(request.data) : null;
    if (literal !== null) {
      options.push(`  body: JSON.stringify(${indentBlock(literal, 2)}),`);
    } else {
      options.push(`  body: ${jsString(request.data)},`);
    }
  }

  const url = jsString(request.url);
  const lines: string[] = [];
  if (options.length === 0) {
    lines.push(`const response = await fetch(${url});`);
  } else {
    lines.push(`const response = await fetch(${url}, {`);
    lines.push(...options);
    lines.push("});");
  }

  const wantsJson = request.isJson && request.data != null;
  lines.push("", `const data = await response.${wantsJson ? "json" : "text"}();`, "console.log(data);");

  return lines.join("\n");
}
