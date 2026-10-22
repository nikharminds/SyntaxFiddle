import { describe, expect, it } from "vitest";
import { parseCurl, transpileCurl } from "../index";
import { generateApex } from "../generators/apex";

describe("apex generator: single-quote escaping", () => {
  it("escapes single quotes inside a JSON body (O'Connor)", () => {
    const command = `curl -X POST https://api.example.com/users -H 'Content-Type: application/json' --data-raw '{"name": "O'\\''Connor"}'`;
    const output = generateApex(parseCurl(command));
    expect(output).toContain("req.setBody('{\"name\":\"O\\'Connor\"}');");
  });

  it("escapes single quotes in raw bodies while preserving spacing byte-for-byte", () => {
    const command = `curl -X POST https://api.example.com/users -H 'Content-Type: text/plain' --data-raw '{"name": "O'\\''Connor"}'`;
    const output = generateApex(parseCurl(command));
    expect(output).toContain("req.setBody('{\"name\": \"O\\'Connor\"}');");
  });

  it("emits no unescaped single quote inside any string literal", () => {
    const command = `curl -X POST https://api.example.com/echo -H 'X-Note: it'\\''s fine' --data-raw '{"msg": "don'\\''t break"}'`;
    const output = generateApex(parseCurl(command));
    for (const literal of output.match(/'(?:[^'\\]|\\.)*'/g) ?? []) {
      expect(literal.startsWith("\\'")).toBe(false);
    }
    expect(output).toContain("req.setHeader('X-Note', 'it\\'s fine');");
  });
});

describe("apex generator: basic auth", () => {
  it("encodes -u credentials through EncodingUtil.base64Encode(Blob.valueOf(...))", () => {
    const output = transpileCurl("curl -u user:pass https://api.example.com/secure", "apex");
    expect(output).toContain("EncodingUtil.base64Encode");
    expect(output).toContain("Blob.valueOf('user:pass')");
    expect(output).toContain(
      "req.setHeader('Authorization', 'Basic ' + EncodingUtil.base64Encode(Blob.valueOf('user:pass')));",
    );
  });

  it("skips the generated Basic header when an explicit Authorization header exists", () => {
    const output = transpileCurl(
      "curl -u user:pass -H 'Authorization: Bearer tok' https://api.example.com/secure",
      "apex",
    );
    expect(output).not.toContain("EncodingUtil");
    expect(output).toContain("req.setHeader('Authorization', 'Bearer tok');");
  });
});

describe("apex generator: method formatting", () => {
  it("uppercases a lowercase -X post verb", () => {
    const output = transpileCurl("curl -X post https://api.example.com/jobs -d 'source=cli'", "apex");
    expect(output).toContain("req.setMethod('POST');");
  });

  it("uppercases custom verbs and keeps the execution boilerplate", () => {
    const output = transpileCurl("curl -X proppatch https://api.example.com/dav", "apex");
    expect(output).toContain("req.setMethod('PROPPATCH');");
    expect(output).toContain("Http http = new Http();");
    expect(output).toContain("HttpResponse res = http.send(req);");
    expect(output).toContain("System.debug('Status: ' + res.getStatusCode());");
    expect(output).toContain("System.debug('Body: ' + res.getBody());");
  });
});
