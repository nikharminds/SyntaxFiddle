import type { ParsedCurlRequest } from "../parser";

function phpString(value: string): string {
  return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

function pad(level: number): string {
  return " ".repeat(level * 4);
}

function phpValue(value: unknown, level: number): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return phpString(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value.map((item) => `${pad(level + 1)}${phpValue(item, level + 1)},`);
    return `[\n${items.join("\n")}\n${pad(level)}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return "[]";
  const items = entries.map(
    ([key, entry]) => `${pad(level + 1)}${phpString(key)} => ${phpValue(entry, level + 1)},`,
  );
  return `[\n${items.join("\n")}\n${pad(level)}]`;
}

export function generatePhp(request: ParsedCurlRequest): string {
  const headers = Object.entries(request.headers);
  const hasAuthorizationHeader = headers.some(([name]) => name.toLowerCase() === "authorization");

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

  const optionHeaders = headers.filter(([name]) =>
    hasParsedJson ? name.toLowerCase() !== "content-type" : true,
  );

  const optionLines: string[] = [];
  if (optionHeaders.length > 0) {
    optionLines.push(`        'headers' => ${phpValue(Object.fromEntries(optionHeaders), 2)},`);
  }
  if (request.data != null && hasParsedJson) {
    optionLines.push(`        'json' => ${phpValue(parsedJson, 2)},`);
  } else if (request.data != null) {
    optionLines.push(`        'body' => ${phpString(request.data)},`);
  }
  if (request.auth && !hasAuthorizationHeader) {
    optionLines.push(
      `        'auth' => [${phpString(request.auth.user)}, ${phpString(request.auth.pass)}],`,
    );
  }

  const lines: string[] = [
    "<?php",
    "use GuzzleHttp\\Client;",
    "use GuzzleHttp\\Exception\\RequestException;",
    "",
    "$client = new Client();",
    "",
    "try {",
  ];
  if (optionLines.length === 0) {
    lines.push(
      `    $response = $client->request(${phpString(request.method)}, ${phpString(request.url)});`,
    );
  } else {
    lines.push(
      `    $response = $client->request(${phpString(request.method)}, ${phpString(request.url)}, [`,
    );
    lines.push(...optionLines);
    lines.push("    ]);");
  }
  lines.push(
    "",
    "    echo $response->getBody();",
    "} catch (RequestException $e) {",
    "    echo $e->getMessage();",
    "}",
  );

  return lines.join("\n");
}
