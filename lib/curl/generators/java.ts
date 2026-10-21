import type { ParsedCurlRequest } from "../parser";

function javaString(value: string): string {
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

function compactJson(data: string): string {
  try {
    return JSON.stringify(JSON.parse(data));
  } catch {
    return data;
  }
}

export function generateJava(request: ParsedCurlRequest): string {
  const headers = Object.entries(request.headers);
  const hasAuthorizationHeader = headers.some(([name]) => name.toLowerCase() === "authorization");
  const contentType = headers.find(([name]) => name.toLowerCase() === "content-type")?.[1];

  const data = request.data != null ? request.data : null;
  const hasBody = data !== null;
  const bodyLiteral = hasBody
    ? javaString(request.isJson ? compactJson(data) : data)
    : null;

  const imports = new Set<string>(["java.io.IOException", "okhttp3.OkHttpClient", "okhttp3.Request"]);
  const declarations: string[] = [];
  if (hasBody) {
    imports.add("okhttp3.RequestBody");
    if (contentType) {
      imports.add("okhttp3.MediaType");
      declarations.push(`        MediaType mediaType = MediaType.parse(${javaString(contentType)});`);
      declarations.push(`        RequestBody body = RequestBody.create(${bodyLiteral}, mediaType);`);
    } else {
      declarations.push(`        RequestBody body = RequestBody.create(${bodyLiteral}, null);`);
    }
  }
  imports.add("okhttp3.Response");

  const method = request.method;
  let methodCall: string;
  if (method === "GET") {
    methodCall = ".get()";
  } else if (method === "HEAD") {
    methodCall = ".head()";
  } else if (method === "POST") {
    methodCall = ".post(body)";
  } else if (method === "PUT") {
    methodCall = ".put(body)";
  } else if (method === "PATCH") {
    methodCall = ".patch(body)";
  } else if (method === "DELETE") {
    methodCall = hasBody ? ".delete(body)" : ".delete()";
  } else {
    methodCall = `.method(${javaString(method)}, ${hasBody ? "body" : "null"})`;
  }

  const chainLines = [`            .url(${javaString(request.url)})`, `            ${methodCall}`];
  for (const [name, value] of headers) {
    chainLines.push(`            .header(${javaString(name)}, ${javaString(value)})`);
  }
  if (request.auth && !hasAuthorizationHeader) {
    const credentials = base64Utf8(`${request.auth.user}:${request.auth.pass}`);
    chainLines.push(`            .header("Authorization", "Basic ${credentials}")`);
  }

  const importBlock = [...imports]
    .sort((left, right) => {
      const leftOk = left.startsWith("java.");
      const rightOk = right.startsWith("java.");
      if (leftOk !== rightOk) return leftOk ? -1 : 1;
      return left.localeCompare(right);
    })
    .map((name) => `import ${name};`)
    .join("\n");

  const lines = [
    importBlock,
    "",
    "public class Main {",
    "    public static void main(String[] args) throws IOException {",
    "        OkHttpClient client = new OkHttpClient();",
    "",
    ...declarations,
    ...(declarations.length > 0 ? [""] : []),
    "        Request request = new Request.Builder()",
    ...chainLines,
    "            .build();",
    "",
    "        try (Response response = client.newCall(request).execute()) {",
    "            System.out.println(response.body().string());",
    "        }",
    "    }",
    "}",
    "",
  ];

  return lines.join("\n");
}
