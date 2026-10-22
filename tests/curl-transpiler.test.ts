import { describe, expect, it } from "vitest";
import { parseCurl, transpileCurl } from "../lib/curl";
import type { ParsedCurlRequest } from "../lib/curl";

function extractJsonStringifyLiteral(output: string): string {
  const marker = "JSON.stringify(";
  const start = output.indexOf(marker);
  expect(start).toBeGreaterThan(-1);
  const end = output.indexOf("}),\n});", start);
  expect(end).toBeGreaterThan(-1);
  return output.slice(start + marker.length, end + 1);
}

function assertNoMultilinePythonStrings(output: string) {
  for (const line of output.split("\n")) {
    const quotes = (line.match(/(?<!\\)"/g) ?? []).length;
    expect(quotes % 2 === 0, `unbalanced quotes on line: ${line}`).toBe(true);
  }
}

describe("bash escaping & whitespace", () => {
  it("joins multi-line commands with trailing backslashes and indentation", () => {
    const command = [
      "curl https://api.example.com/v1/shipments \\",
      "    -X PUT \\",
      "    -H 'Content-Type: application/json' \\",
      "    --data '{\"status\": \"shipped\"}'",
    ].join("\n");
    const request = parseCurl(command);
    expect(request.method).toBe("PUT");
    expect(request.data).toBe('{"status": "shipped"}');
  });

  it("supports line continuations that use CRLF endings", () => {
    const command = [
      "curl https://api.example.com/ping \\",
      "  -H 'X-Client: web'",
    ].join("\r\n");
    const request = parseCurl(command);
    expect(request.url).toBe("https://api.example.com/ping");
    expect(request.headers["X-Client"]).toBe("web");
  });

  it("tolerates bare CRLF newlines between flags", () => {
    const command = "curl https://api.example.com/jobs\r\n  -X POST\r\n  -d 'source=cli'";
    const request = parseCurl(command);
    expect(request.method).toBe("POST");
    expect(request.data).toBe("source=cli");
    expect(request.url).toBe("https://api.example.com/jobs");
  });

  it("unescapes backslash-escaped quotes inside single-quoted payloads", () => {
    const request = parseCurl(`curl -d '{"key": "don\\'t"}' https://api.example.com/echo`);
    expect(request.data).toBe('{"key": "don\'t"}');
    expect(request.isJson).toBe(true);
  });

  it("preserves the strict-bash '\\'' round-trip idiom", () => {
    const request = parseCurl(`curl -d 'it'\\''s fine' https://api.example.com/echo`);
    expect(request.data).toBe("it's fine");
  });

  it("keeps escaped spaces inside unquoted tokens", () => {
    const request = parseCurl("curl -d hello\\ world https://api.example.com/echo");
    expect(request.data).toBe("hello world");
  });
});

describe("authentication variants", () => {
  it("parses -u and --user identically", () => {
    const shortForm: ParsedCurlRequest = parseCurl(
      "curl -u aladdin:opensesame https://api.example.com/treasure",
    );
    const longForm: ParsedCurlRequest = parseCurl(
      'curl --user "aladdin:opensesame" https://api.example.com/treasure',
    );
    expect(shortForm.auth).toEqual({ user: "aladdin", pass: "opensesame" });
    expect(longForm.auth).toEqual(shortForm.auth);
  });

  it("splits credentials on the first colon only", () => {
    const request = parseCurl("curl -u 'svc:p@ss:w0rd:!' https://api.example.com/");
    expect(request.auth).toEqual({ user: "svc", pass: "p@ss:w0rd:!" });
  });

  it("defaults the password to empty when -u has no colon", () => {
    const request = parseCurl("curl -u just-a-key https://api.example.com/");
    expect(request.auth).toEqual({ user: "just-a-key", pass: "" });
  });

  it("preserves bearer tokens verbatim across every target", () => {
    const token = "Bearer eyJhbGciOiJIUzI1NiJ9.S1G_n-a-t.u_r3";
    const command = `curl https://api.example.com/me -H 'Authorization: ${token}'`;
    expect(transpileCurl(command, "fetch")).toContain(`"Authorization": "${token}"`);
    expect(transpileCurl(command, "axios")).toContain(`"Authorization": "${token}"`);
    expect(transpileCurl(command, "python")).toContain(`"Authorization": "${token}"`);
  });

  it("prefers an explicit Authorization header over -u in generated code", () => {
    const command = `curl -u admin:secret -H 'Authorization: Bearer tok' https://api.example.com/`;
    const fetchOutput = transpileCurl(command, "fetch");
    expect(fetchOutput).not.toContain("Basic ");
    expect(fetchOutput).toContain('"Authorization": "Bearer tok"');
    const axiosOutput = transpileCurl(command, "axios");
    expect(axiosOutput).not.toContain("username:");
  });

  it("encodes basic auth per target idiom", () => {
    const command = "curl -u admin:secret https://api.example.com/admin";
    expect(transpileCurl(command, "fetch")).toContain("Basic YWRtaW46c2VjcmV0");
    expect(transpileCurl(command, "axios")).toContain('username: "admin"');
    expect(transpileCurl(command, "python")).toContain('auth=("admin", "secret")');
  });
});

describe("payload & header anomalies", () => {
  it("keeps URLs with query parameters inside JSON bodies verbatim", () => {
    const body = '{"callback": "https://hooks.example.com/done?code=abc&state=1", "next": "/items?page=2&size=50"}';
    const request = parseCurl(
      `curl -X POST https://api.example.com/subscriptions -H 'Content-Type: application/json' --data-raw '${body}'`,
    );
    expect(request.isJson).toBe(true);
    const fetchOutput = transpileCurl(
      `curl -X POST https://api.example.com/subscriptions -H 'Content-Type: application/json' --data-raw '${body}'`,
      "fetch",
    );
    expect(fetchOutput).toContain('"callback": "https://hooks.example.com/done?code=abc&state=1"');
    expect(JSON.parse(extractJsonStringifyLiteral(fetchOutput))).toEqual(JSON.parse(body));
  });

  it("treats form-encoded payloads as raw strings, never JSON", () => {
    const command = 'curl --data "key1=val1&key2=val2" https://api.example.com/form';
    const request = parseCurl(command);
    expect(request.isJson).toBe(false);
    expect(request.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
    const fetchOutput = transpileCurl(command, "fetch");
    expect(fetchOutput).toContain('body: "key1=val1&key2=val2"');
    expect(fetchOutput).not.toContain("JSON.stringify");
    expect(transpileCurl(command, "python")).toContain('data = "key1=val1&key2=val2"');
  });

  it("collapses duplicate headers case-insensitively with the last value winning", () => {
    const request = parseCurl(
      "curl https://api.example.com/ -H 'X-Request-Id: one' -H 'x-request-id: two' -H 'X-REQUEST-ID: three'",
    );
    const keys = Object.keys(request.headers).filter(
      (name) => name.toLowerCase() === "x-request-id",
    );
    expect(keys).toHaveLength(1);
    expect(request.headers[keys[0]!]).toBe("three");
  });

  it("empty body with explicit -X POST emits no body and no injected content type", () => {
    const command = "curl -X POST https://api.example.com/jobs/42/retry";
    const request = parseCurl(command);
    expect(request.method).toBe("POST");
    expect(request.data).toBeNull();
    expect(request.headers).toEqual({});
    const fetchOutput = transpileCurl(command, "fetch");
    expect(fetchOutput).toContain('method: "POST"');
    expect(fetchOutput).not.toContain("body:");
    expect(transpileCurl(command, "python")).toContain("response = requests.post(url)");
  });

  it("merges repeated -d flags with & exactly like curl", () => {
    const request = parseCurl(
      "curl https://api.example.com/search -d q=curl -d page=3 -d 'lang=en'",
    );
    expect(request.data).toBe("q=curl&page=3&lang=en");
  });
});

describe("transpiler output validation", () => {
  it("python string literals never contain raw newlines", () => {
    const command = "curl --data-raw $'line1\\nline2' https://api.example.com/echo";
    const pythonOutput = transpileCurl(command, "python");
    const dataLine = pythonOutput.split("\n").find((line) => line.startsWith("data ="));
    expect(dataLine).toBe('data = "line1\\nline2"');
    assertNoMultilinePythonStrings(pythonOutput);
  });

  it("python rewrites JSON literals to True/False/None", () => {
    const command = `curl -H 'Content-Type: application/json' -d '{"ok": true, "off": false, "gap": null, "n": 1.5}' https://api.example.com/echo`;
    const pythonOutput = transpileCurl(command, "python");
    expect(pythonOutput).toContain('"ok": True');
    expect(pythonOutput).toContain('"off": False');
    expect(pythonOutput).toContain('"gap": None');
    expect(pythonOutput).not.toMatch(/: (true|false|null)/);
    assertNoMultilinePythonStrings(pythonOutput);
  });

  it("fetch round-trips JSON.stringify bodies through JSON.parse", () => {
    const payload = { name: "Ada Lovelace", tags: ["math", "computing"], active: true };
    const command = `curl -X POST https://api.example.com/users -H 'Content-Type: application/json' -d '${JSON.stringify(payload)}'`;
    const literal = extractJsonStringifyLiteral(transpileCurl(command, "fetch"));
    expect(JSON.parse(literal)).toEqual(payload);
  });

  it("fetch falls back to a raw string body when JSON is invalid despite the content type", () => {
    const command = `curl -X POST https://api.example.com/log -H 'Content-Type: application/json' -d 'not-json{'`;
    const fetchOutput = transpileCurl(command, "fetch");
    expect(fetchOutput).not.toContain("JSON.stringify");
    expect(fetchOutput).toContain('body: "not-json{"');
  });

  it("axios embeds parsed object literals for JSON bodies", () => {
    const command = `curl -X POST https://api.example.com/todos -H 'Content-Type: application/json' -d '{"title": "ship it"}'`;
    const axiosOutput = transpileCurl(command, "axios");
    expect(axiosOutput).toContain("data: {");
    expect(axiosOutput).toContain('"title": "ship it"');
    expect(axiosOutput).not.toContain("JSON.stringify");
  });

  it("survives deeply nested payloads across all targets", () => {
    let deep: unknown = { leaf: true };
    for (let index = 0; index < 120; index += 1) {
      deep = { nested: deep, index };
    }
    const body = JSON.stringify(deep);
    const command = `curl -X POST https://api.example.com/deep -H 'Content-Type: application/json' --data-raw '${body}'`;
    const literal = extractJsonStringifyLiteral(transpileCurl(command, "fetch"));
    expect(JSON.parse(literal)).toEqual(deep);
    const pythonOutput = transpileCurl(command, "python");
    expect(pythonOutput).toContain('"leaf": True');
    assertNoMultilinePythonStrings(pythonOutput);
    expect(() => transpileCurl(command, "axios")).not.toThrow();
  });
});

describe("php guzzle generator", () => {
  const command = `curl -X POST https://api.example.com/todos -H 'Content-Type: application/json' -u admin:secret --data-raw '{"title": "ship it", "done": false, "meta": null}'`;

  it("emits a $client->request call with json and auth options", () => {
    const output = transpileCurl(command, "php");
    expect(output).toContain("$client->request('POST', 'https://api.example.com/todos', [");
    expect(output).toContain("'json' => [");
    expect(output).toContain("'title' => 'ship it'");
    expect(output).toContain("'done' => false");
    expect(output).toContain("'meta' => null");
    expect(output).toContain("'auth' => ['admin', 'secret']");
    expect(output).toContain("$response->getBody()");
  });

  it("keeps raw bodies under 'body' with urlencoded semantics", () => {
    const output = transpileCurl("curl -d 'a=1&b=2' https://api.example.com/f", "php");
    expect(output).toContain("'body' => 'a=1&b=2'");
    expect(output).not.toContain("'json' =>");
  });

  it("emits a single-line call for bare GET requests", () => {
    const output = transpileCurl("curl https://api.example.com/health", "php");
    expect(output).toContain("$client->request('GET', 'https://api.example.com/health');");
    expect(output).not.toContain("[");
  });
});

describe("go net/http generator", () => {
  const command = `curl -X POST https://api.example.com/todos -H 'Content-Type: application/json' -u admin:secret --data-raw '{"title": "ship it", "tags": ["a"], "done": false, "meta": null}'`;

  it("marshals a map[string]any literal and uses method constants", () => {
    const output = transpileCurl(command, "go");
    expect(output).toContain("http.NewRequest(http.MethodPost");
    expect(output).toContain("payload := map[string]any{");
    expect(output).toContain('"title": "ship it"');
    expect(output).toContain("[]any{");
    expect(output).toContain('"done": false');
    expect(output).toContain('"meta": nil');
    expect(output).toContain("json.Marshal(payload)");
    expect(output).toContain("bytes.NewReader(body)");
  });

  it("uses strings.NewReader for raw bodies and computes imports", () => {
    const output = transpileCurl("curl -d 'a=1&b=2' https://api.example.com/f", "go");
    expect(output).toContain(`strings.NewReader("a=1&b=2")`);
    expect(output).not.toContain("encoding/json");
    expect(output).toContain('"fmt"');
  });

  it("maps basic auth to SetBasicAuth and nil body for GET", () => {
    const output = transpileCurl("curl -u admin:secret https://api.example.com/", "go");
    expect(output).toContain(`req.SetBasicAuth("admin", "secret")`);
    expect(output).toMatch(/http\.NewRequest\(http\.MethodGet, .*, nil\)/);
  });
});

describe("csharp httpclient generator", () => {
  const command = `curl -X POST https://api.example.com/todos -H 'Content-Type: application/json' -H 'X-Request-Id: abc' -u admin:secret --data-raw '{"title": "ship it", "done": false}'`;

  it("builds an HttpRequestMessage with a raw string StringContent", () => {
    const output = transpileCurl(command, "csharp");
    expect(output).toContain("new HttpRequestMessage(HttpMethod.Post, \"https://api.example.com/todos\")");
    expect(output).toContain('new StringContent(');
    expect(output).toContain('"""');
    expect(output).toContain('{"title":"ship it","done":false}');
    expect(output).toContain('"application/json");');
    expect(output).toContain('request.Headers.Add("X-Request-Id", "abc");');
    expect(output).toContain('new AuthenticationHeaderValue("Basic", "YWRtaW46c2VjcmV0")');
    expect(output).toContain("using System.Net.Http.Headers;");
  });

  it("omits content for bare GET requests", () => {
    const output = transpileCurl("curl https://api.example.com/health", "csharp");
    expect(output).toContain("new HttpRequestMessage(HttpMethod.Get");
    expect(output).not.toContain("StringContent");
    expect(output).not.toContain("System.Text");
  });
});

describe("java okhttp generator", () => {
  const command = `curl -X POST https://api.example.com/todos -H 'Content-Type: application/json' -H 'X-Request-Id: abc' -u admin:secret --data-raw '{"title": "ship it"}'`;

  it("builds a Request chain with a compacted json body", () => {
    const output = transpileCurl(command, "java");
    expect(output).toContain("Request request = new Request.Builder()");
    expect(output).toContain('.url("https://api.example.com/todos")');
    expect(output).toContain(".post(body)");
    expect(output).toContain('.header("X-Request-Id", "abc")');
    expect(output).toContain('.header("Authorization", "Basic YWRtaW46c2VjcmV0")');
    expect(output).toContain('MediaType.parse("application/json")');
    expect(output).toContain('RequestBody.create("{\\"title\\":\\"ship it\\"}", mediaType)');
    expect(output).toContain("try (Response response = client.newCall(request).execute())");
  });

  it("uses .get() and skips body declarations for bare GET requests", () => {
    const output = transpileCurl("curl https://api.example.com/health", "java");
    expect(output).toContain(".get()");
    expect(output).not.toContain("RequestBody");
    expect(output).not.toContain("MediaType");
  });

  it("falls back to .method(...) for custom verbs", () => {
    const output = transpileCurl("curl -X PROPFIND https://api.example.com/dav", "java");
    expect(output).toContain('.method("PROPFIND", null)');
  });
});

describe("apex httprequest generator", () => {
  const command = `curl -X POST https://api.example.com/todos -H 'Content-Type: application/json' -H 'X-Request-Id: abc' -u admin:secret --data-raw '{"title": "ship it"}'`;

  it("builds an HttpRequest with a compacted single-line body", () => {
    const output = transpileCurl(command, "apex");
    expect(output).toContain("HttpRequest req = new HttpRequest();");
    expect(output).toContain("req.setEndpoint('https://api.example.com/todos');");
    expect(output).toContain("req.setMethod('POST');");
    expect(output).toContain("req.setHeader('Content-Type', 'application/json');");
    expect(output).toContain("req.setHeader('X-Request-Id', 'abc');");
    expect(output).toContain('req.setBody(\'{"title":"ship it"}\');');
    expect(output).toContain("Http http = new Http();");
    expect(output).toContain("HttpResponse res = http.send(req);");
    expect(output).toContain("System.debug('Status: ' + res.getStatusCode());");
    expect(output).toContain("System.debug('Body: ' + res.getBody());");
  });

  it("encodes basic auth with EncodingUtil and prefers explicit Authorization headers", () => {
    const output = transpileCurl(command, "apex");
    expect(output).toContain(
      "req.setHeader('Authorization', 'Basic ' + EncodingUtil.base64Encode(Blob.valueOf('admin:secret')));",
    );
    const bearer = transpileCurl(
      "curl -u admin:secret -H 'Authorization: Bearer tok' https://api.example.com/",
      "apex",
    );
    expect(bearer).not.toContain("EncodingUtil");
    expect(bearer).toContain("req.setHeader('Authorization', 'Bearer tok');");
  });

  it("escapes single quotes, backslashes, and newlines inside literals", () => {
    const output = transpileCurl(
      `curl -d $'it\\'s "quoted"\\nline2 \\\\tmp' https://api.example.com/echo`,
      "apex",
    );
    const bodyLine = output.split("\n").find((line) => line.startsWith("req.setBody"));
    expect(bodyLine).toBe("req.setBody('it\\'s \"quoted\"\\nline2 \\\\tmp');");
  });

  it("keeps multiline bodies on a single line via newline escapes", () => {
    const output = transpileCurl(
      "curl --data-raw $'line1\\nline2' https://api.example.com/echo",
      "apex",
    );
    const bodyLine = output.split("\n").find((line) => line.startsWith("req.setBody"));
    expect(bodyLine).toBe("req.setBody('line1\\nline2');");
  });

  it("omits setBody and setHeader for bare GET requests", () => {
    const output = transpileCurl("curl https://api.example.com/health", "apex");
    expect(output).toContain("req.setMethod('GET');");
    expect(output).not.toContain("setBody");
    expect(output).not.toContain("setHeader");
  });
});
