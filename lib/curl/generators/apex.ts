import type { ParsedCurlRequest } from "../parser";

function apexString(value: string): string {
  return `'${value
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")}'`;
}

function compactJson(data: string): string {
  try {
    return JSON.stringify(JSON.parse(data));
  } catch {
    return data;
  }
}

export function generateApex(request: ParsedCurlRequest): string {
  const headers = Object.entries(request.headers);
  const hasAuthorizationHeader = headers.some(([name]) => name.toLowerCase() === "authorization");
  const method = request.method.toUpperCase();

  const lines: string[] = [
    "HttpRequest req = new HttpRequest();",
    `req.setEndpoint(${apexString(request.url)});`,
    `req.setMethod(${apexString(method)});`,
  ];

  for (const [name, value] of headers) {
    lines.push(`req.setHeader(${apexString(name)}, ${apexString(value)});`);
  }

  if (request.auth && !hasAuthorizationHeader) {
    const credentials = `${request.auth.user}:${request.auth.pass}`;
    lines.push(
      `req.setHeader('Authorization', 'Basic ' + EncodingUtil.base64Encode(Blob.valueOf(${apexString(credentials)})));`,
    );
  }

  if (request.data != null) {
    const body = request.isJson ? compactJson(request.data) : request.data;
    lines.push(`req.setBody(${apexString(body)});`);
  }

  lines.push(
    "",
    "Http http = new Http();",
    "HttpResponse res = http.send(req);",
    "System.debug('Status: ' + res.getStatusCode());",
    "System.debug('Body: ' + res.getBody());",
  );

  return lines.join("\n");
}
