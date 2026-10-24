import type { ParsedCurlRequest } from "../parser";

const METHOD_NAMES: Record<string, string> = {
  GET: "Get",
  POST: "Post",
  PUT: "Put",
  PATCH: "Patch",
  DELETE: "Delete",
  HEAD: "Head",
  OPTIONS: "Options",
};

function psSingleQuoted(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function base64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function psBody(data: string): string {
  // Single-quoted here-string: no interpolation, JSON stays verbatim.
  // A line consisting of '@ or "@ would terminate the here-string — fall back
  // to a single-quoted literal with doubled quotes for that pathological case.
  if (/(^|\n)\s*'@/.test(data) || /(^|\n)\s*"@/.test(data)) {
    return psSingleQuoted(data);
  }
  return `@'\n${data}\n'@`;
}

export function generatePowershell(request: ParsedCurlRequest): string {
  const headers = Object.entries(request.headers);
  const contentType = headers.find(([name]) => name.toLowerCase() === "content-type")?.[1];
  const method = METHOD_NAMES[request.method.toUpperCase()] ?? request.method;

  const params: string[] = [];
  params.push(`    Uri         = ${psSingleQuoted(request.url)}`);
  params.push(`    Method      = '${method}'`);

  if (headers.length > 0) {
    const hasAuthorization = headers.some(([name]) => name.toLowerCase() === "authorization");
    const headerEntries = headers
      .filter(([name]) =>
        request.data != null ? name.toLowerCase() !== "content-type" : true,
      )
      .map(([name, value]) => `        ${psSingleQuoted(name)} = ${psSingleQuoted(value)}`);

    if (request.auth && !hasAuthorization) {
      const credentials = base64Utf8(`${request.auth.user}:${request.auth.pass}`);
      headerEntries.push(
        `        'Authorization' = 'Basic ${credentials}'`,
      );
    }
    if (headerEntries.length > 0) {
      params.push(`    Headers     = @{\n${headerEntries.join("\n")}\n    }`);
    }
  } else if (request.auth) {
    const credentials = base64Utf8(`${request.auth.user}:${request.auth.pass}`);
    params.push(`    Headers     = @{\n        'Authorization' = 'Basic ${credentials}'\n    }`);
  }

  if (request.data != null) {
    params.push(`    Body        = ${psBody(request.data)}`);
    params.push(`    ContentType = ${psSingleQuoted(contentType ?? "text/plain")}`);
  }

  const lines = [
    "$params = @{",
    ...params,
    "}",
    "",
    "$response = Invoke-RestMethod @params",
    "$response | ConvertTo-Json -Depth 10",
  ];

  return lines.join("\n");
}
