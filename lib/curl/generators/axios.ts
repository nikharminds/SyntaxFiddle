import type { ParsedCurlRequest } from "../parser";

function jsString(value: string): string {
  return JSON.stringify(value);
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

export function generateAxios(request: ParsedCurlRequest): string {
  const headers = Object.entries(request.headers);
  const hasAuthorizationHeader = headers.some(([name]) => name.toLowerCase() === "authorization");

  const options: string[] = [];
  if (request.method !== "GET") {
    options.push(`  method: ${jsString(request.method.toLowerCase())},`);
  }
  options.push(`  url: ${jsString(request.url)},`);
  if (headers.length > 0) {
    options.push(`  headers: ${renderEntries(headers, "  ")},`);
  }
  if (request.data != null) {
    const literal = request.isJson ? jsonLiteral(request.data) : null;
    if (literal !== null) {
      options.push(`  data: ${indentBlock(literal, 2)},`);
    } else {
      options.push(`  data: ${jsString(request.data)},`);
    }
  }
  if (request.auth && !hasAuthorizationHeader) {
    options.push(
      `  auth: {\n    username: ${jsString(request.auth.user)},\n    password: ${jsString(
        request.auth.pass,
      )},\n  },`,
    );
  }

  const lines = [
    'import axios from "axios";',
    "",
    "const response = await axios.request({",
    ...options,
    "});",
    "",
    "console.log(response.data);",
  ];

  return lines.join("\n");
}
