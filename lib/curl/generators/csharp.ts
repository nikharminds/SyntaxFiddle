import type { ParsedCurlRequest } from "../parser";

const METHOD_EXPRESSIONS: Record<string, string> = {
  GET: "HttpMethod.Get",
  POST: "HttpMethod.Post",
  PUT: "HttpMethod.Put",
  PATCH: "HttpMethod.Patch",
  DELETE: "HttpMethod.Delete",
  HEAD: "HttpMethod.Head",
  OPTIONS: "HttpMethod.Options",
};

const RAW_STRING_DELIMITER = '"""';

function csString(value: string): string {
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

function csBodyString(data: string, compact: boolean): string {
  let content = data;
  if (compact) {
    try {
      content = JSON.stringify(JSON.parse(data));
    } catch {
      content = data;
    }
  }
  if (content.includes(RAW_STRING_DELIMITER)) {
    return csString(content);
  }
  return `${RAW_STRING_DELIMITER}\n    ${content}\n    ${RAW_STRING_DELIMITER}`;
}

export function generateCsharp(request: ParsedCurlRequest): string {
  const headers = Object.entries(request.headers);
  const hasAuthorizationHeader = headers.some(([name]) => name.toLowerCase() === "authorization");
  const method = METHOD_EXPRESSIONS[request.method] ?? `new HttpMethod(${csString(request.method)})`;

  const contentType = headers.find(([name]) => name.toLowerCase() === "content-type")?.[1];
  const headerLines = headers
    .filter(([name]) =>
      request.data != null ? name.toLowerCase() !== "content-type" : true,
    )
    .map(([name, value]) => `request.Headers.Add(${csString(name)}, ${csString(value)});`);

  const usingLines = new Set<string>(["System.Net.Http"]);
  const prelude: string[] = [];
  if (request.auth && !hasAuthorizationHeader) {
    usingLines.add("System.Net.Http.Headers");
    const credentials = base64Utf8(`${request.auth.user}:${request.auth.pass}`);
    prelude.push(
      `request.Headers.Authorization = new AuthenticationHeaderValue("Basic", "${credentials}");`,
    );
  }

  const contentLines: string[] = [];
  if (request.data != null) {
    usingLines.add("System.Text");
    contentLines.push("request.Content = new StringContent(");
    contentLines.push(`    ${csBodyString(request.data, request.isJson)},`);
    contentLines.push("    Encoding.UTF8,");
    contentLines.push(`    ${csString(contentType ?? "text/plain")});`);
  }

  const lines: string[] = [
    ...[...usingLines].sort().map((name) => `using ${name};`),
    "",
    "var client = new HttpClient();",
    "",
    `var request = new HttpRequestMessage(${method}, ${csString(request.url)});`,
    ...prelude,
    ...headerLines,
    ...contentLines,
    "",
    "using var response = await client.SendAsync(request);",
    "var body = await response.Content.ReadAsStringAsync();",
    "Console.WriteLine(body);",
  ];

  return lines.join("\n");
}
