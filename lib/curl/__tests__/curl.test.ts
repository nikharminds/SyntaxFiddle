import { describe, expect, it } from "vitest";
import { CurlParseError, parseCurl, transpileCurl } from "../index";

describe("curl tokenizer", () => {
  it("parses a bare GET url and preserves query parameters", () => {
    const request = parseCurl("curl https://api.example.com/todos?limit=10&status=open");
    expect(request.method).toBe("GET");
    expect(request.url).toBe("https://api.example.com/todos?limit=10&status=open");
    expect(request.data).toBeNull();
    expect(request.isJson).toBe(false);
  });

  it("works without the leading curl keyword and defaults the scheme", () => {
    const request = parseCurl("example.com/todos");
    expect(request.url).toBe("http://example.com/todos");
  });

  it("joins line-continuation backslashes into a single command", () => {
    const command = [
      "curl https://api.example.com/todos \\",
      "  -H 'Authorization: Bearer tok' \\",
      "  --request POST \\",
      "  --data-raw '{\"title\": \"write tests\"}'",
    ].join("\n");
    const request = parseCurl(command);
    expect(request.method).toBe("POST");
    expect(request.headers["Authorization"]).toBe("Bearer tok");
    expect(request.data).toBe('{"title": "write tests"}');
  });

  it("supports escaped quotes inside double-quoted bodies", () => {
    const command = `curl -X POST https://api.example.com/echo -d "{\\"name\\": \\"John \\\\\\"Doe\\\\\\"\\"}"`;
    const request = parseCurl(command);
    expect(request.data).toBe('{"name": "John \\"Doe\\""}');
  });

  it("handles the '\\'' single-quote idiom for apostrophes", () => {
    const request = parseCurl(`curl -d 'it'\\''s fine' https://api.example.com/echo`);
    expect(request.data).toBe("it's fine");
    expect(request.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
  });

  it("decodes ANSI-C $'...' quoted bodies", () => {
    const request = parseCurl("curl --data-raw $'line1\\nline2' https://api.example.com/echo");
    expect(request.data).toBe("line1\nline2");
  });

  it("supports --flag=value inline syntax", () => {
    const request = parseCurl(
      "curl --request=DELETE https://api.example.com/todos/42 --header='X-Trace: on'",
    );
    expect(request.method).toBe("DELETE");
    expect(request.headers["X-Trace"]).toBe("on");
  });
});

describe("curl flag semantics", () => {
  it("defaults to POST when data flags are present", () => {
    const request = parseCurl("curl https://api.example.com/echo -d a=1 -d b=2");
    expect(request.method).toBe("POST");
    expect(request.data).toBe("a=1&b=2");
    expect(request.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
  });

  it("treats body-shaped data without a content type as JSON", () => {
    const request = parseCurl(`curl -d '{"a": 1}' https://api.example.com/echo`);
    expect(request.isJson).toBe(true);
    expect(request.headers["Content-Type"]).toBe("application/json");
  });

  it("respects an explicit content type over JSON inference", () => {
    const request = parseCurl(
      `curl -d '{"a": 1}' -H 'Content-Type: text/plain' https://api.example.com/echo`,
    );
    expect(request.isJson).toBe(false);
    expect(request.headers["Content-Type"]).toBe("text/plain");
  });

  it("supports the --json shorthand", () => {
    const request = parseCurl(`curl --json '{"a": 1}' https://api.example.com/echo`);
    expect(request.isJson).toBe(true);
    expect(request.headers["Accept"]).toBe("application/json");
  });

  it("moves -d data into the query string with -G", () => {
    const request = parseCurl("curl -G https://api.example.com/search -d q=curl -d page=2");
    expect(request.method).toBe("GET");
    expect(request.data).toBeNull();
    expect(request.url).toBe("https://api.example.com/search?q=curl&page=2");
  });

  it("urlencodes --data-urlencode parts", () => {
    const request = parseCurl("curl -G https://api.example.com/search --data-urlencode 'q=hello world'");
    expect(request.url).toBe("https://api.example.com/search?q=hello%20world");
  });

  it("parses -u basic auth and splits user from password", () => {
    const request = parseCurl("curl -u admin:secret https://api.example.com/admin");
    expect(request.auth).toEqual({ user: "admin", pass: "secret" });
  });

  it("extracts credentials embedded in the url", () => {
    const request = parseCurl("curl https://user:pass@api.example.com/v1/data");
    expect(request.auth).toEqual({ user: "user", pass: "pass" });
    expect(request.url).toBe("https://api.example.com/v1/data");
  });

  it("maps -A, -e and -b convenience flags to headers", () => {
    const request = parseCurl(
      "curl -A 'SyntaxFiddle/1.0' -e https://example.com -b 'session=abc' https://api.example.com/",
    );
    expect(request.headers["User-Agent"]).toBe("SyntaxFiddle/1.0");
    expect(request.headers["Referer"]).toBe("https://example.com");
    expect(request.headers["Cookie"]).toBe("session=abc");
  });

  it("lets later headers override earlier ones case-insensitively", () => {
    const request = parseCurl(
      "curl -H 'X-Token: old' -H 'x-token: new' https://api.example.com/",
    );
    expect(Object.keys(request.headers).filter((name) => name.toLowerCase() === "x-token")).toHaveLength(1);
    expect(request.headers["x-token"]).toBe("new");
  });

  it("drops Content-Length headers and ignores cosmetic flags", () => {
    const request = parseCurl(
      "curl -sSL --compressed -H 'Content-Length: 123' https://api.example.com/",
    );
    expect(request.headers["Content-Length"]).toBeUndefined();
    expect(request.method).toBe("GET");
  });
});

describe("curl error handling", () => {
  it("rejects empty commands", () => {
    expect(() => parseCurl("   ")).toThrow(CurlParseError);
    expect(() => parseCurl("curl")).toThrow(/No URL was found/);
  });

  it("rejects unterminated quotes", () => {
    expect(() => parseCurl("curl 'https://api.example.com")).toThrow(/Unterminated single quote/);
    expect(() => parseCurl('curl "https://api.example.com')).toThrow(/Unterminated double quote/);
  });

  it("rejects malformed headers", () => {
    expect(() => parseCurl("curl -H 'NotAHeader' https://api.example.com")).toThrow(
      /Headers must use the form/,
    );
  });

  it("rejects flags with missing values", () => {
    expect(() => parseCurl("curl -X")).toThrow(/expects a value/);
  });

  it("rejects file-backed data sources", () => {
    expect(() => parseCurl("curl -d @payload.json https://api.example.com")).toThrow(/file/);
    expect(() => parseCurl("curl -d @- https://api.example.com")).toThrow(/stdin/);
  });

  it("rejects multipart form uploads", () => {
    expect(() => parseCurl("curl -F name=value https://api.example.com")).toThrow(/multipart/);
  });

  it("throws readable errors instead of crashing", () => {
    try {
      parseCurl("curl -H");
    } catch (error) {
      expect(error).toBeInstanceOf(CurlParseError);
      expect((error as Error).message).toMatch(/expects a value/);
    }
  });
});

describe("transpileCurl generators", () => {
  const command = `curl -X POST https://api.example.com/todos?user=42 \\
    -H 'Content-Type: application/json' \\
    -H 'X-Request-Id: abc' \\
    -u 'admin:secret' \\
    --data-raw '{"title": "ship it", "tags": ["api", "curl"], "done": false, "meta": null}'`;

  it("generates async/await fetch with a JSON.stringify body", () => {
    const output = transpileCurl(command, "fetch");
    expect(output).toContain('await fetch("https://api.example.com/todos?user=42", {');
    expect(output).toContain('method: "POST"');
    expect(output).toContain('"X-Request-Id": "abc"');
    expect(output).toContain("body: JSON.stringify({");
    expect(output).toContain('"title": "ship it"');
    expect(output).toContain("Authorization");
    expect(output).toContain("Basic YWRtaW46c2VjcmV0");
    expect(output).toContain("await response.json()");
    expect(output).toMatchSnapshot();
  });

  it("generates axios.request with auth config", () => {
    const output = transpileCurl(command, "axios");
    expect(output).toContain('import axios from "axios";');
    expect(output).toContain("await axios.request({");
    expect(output).toContain('method: "post"');
    expect(output).toContain("data: {");
    expect(output).toContain('username: "admin"');
    expect(output).toContain('password: "secret"');
    expect(output).toContain("response.data");
    expect(output).toMatchSnapshot();
  });

  it("generates python requests with json= payload", () => {
    const output = transpileCurl(command, "python");
    expect(output).toContain("import requests");
    expect(output).toContain('requests.post(');
    expect(output).toContain('url = "https://api.example.com/todos?user=42"');
    expect(output).toContain('"tags": [');
    expect(output).toContain('"done": False');
    expect(output).toContain('"meta": None');
    expect(output).toContain("json=json_data");
    expect(output).toContain('auth=("admin", "secret")');
    expect(output).toContain("print(response.json())");
    expect(output).toMatchSnapshot();
  });

  it("falls back to data= strings for non-JSON bodies in python", () => {
    const output = transpileCurl(
      "curl -d 'hello=world' https://api.example.com/echo",
      "python",
    );
    expect(output).toContain("data=data");
    expect(output).not.toContain("json=");
  });

  it("emits a bare fetch for plain GET requests", () => {
    const output = transpileCurl("curl https://api.example.com/health", "fetch");
    expect(output).toContain('const response = await fetch("https://api.example.com/health");');
    expect(output).toContain("await response.text()");
  });

  it("uses requests.request for non-standard methods", () => {
    const output = transpileCurl("curl -X PROPFIND https://api.example.com/dav", "python");
    expect(output).toContain('requests.request("PROPFIND", url)');
  });
});
