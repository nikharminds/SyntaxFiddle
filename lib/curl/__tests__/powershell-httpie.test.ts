import { describe, expect, it } from "vitest";
import { parseCurl, transpileCurl } from "../index";
import { generatePowershell } from "../generators/powershell";

describe("powershell generator", () => {
  it("emits a splatted parameter hashtable with Uri and Method", () => {
    const output = transpileCurl(
      "curl 'https://api.example.com/users?limit=5'",
      "powershell",
    );
    expect(output).toContain("$params = @{");
    expect(output).toContain("Uri         = 'https://api.example.com/users?limit=5'");
    expect(output).toContain("Method      = 'Get'");
    expect(output).toContain("Invoke-RestMethod @params");
    expect(output).toContain("ConvertTo-Json -Depth 10");
  });

  it("maps headers into a hashtable and drops Content-Type in favor of -ContentType", () => {
    const command = [
      "curl -X POST https://api.example.com/todos",
      " -H 'Content-Type: application/json'",
      " -H 'X-Request-Id: demo-42'",
      " --data-raw '{\"title\": \"Ship\"}'",
    ].join(" ");
    const output = transpileCurl(command, "powershell");
    expect(output).toContain("Method      = 'Post'");
    expect(output).toContain("'X-Request-Id' = 'demo-42'");
    expect(output).toContain("ContentType = 'application/json'");
    expect(output).not.toContain("'Content-Type'");
    expect(output).toContain("Body        = @'");
  });

  it("keeps JSON bodies verbatim in a single-quoted here-string", () => {
    const output = transpileCurl(
      'curl -X POST https://api.example.com/jobs -H \'Content-Type: application/json\' --data-raw \'{"cost": 5, "tags": ["a", "b"]}\'',
      "powershell",
    );
    expect(output).toContain("@'\n{\"cost\": 5, \"tags\": [\"a\", \"b\"]}\n'@");
  });

  it("pre-encodes basic auth into the Authorization header", () => {
    const output = transpileCurl(
      "curl -u admin:s3cr3t https://api.example.com/stats",
      "powershell",
    );
    expect(output).toContain("'Authorization' = 'Basic ");
    // base64 of admin:s3cr3t
    expect(output).toContain("YWRtaW46czNjcjN0");
  });

  it("skips the generated Basic header when an explicit Authorization exists", () => {
    const output = transpileCurl(
      "curl -u admin:s3cr3t -H 'Authorization: Bearer tok' https://api.example.com/stats",
      "powershell",
    );
    expect(output).not.toContain("Basic ");
    expect(output).toContain("'Authorization' = 'Bearer tok'");
  });

  it("escapes single quotes by doubling them", () => {
    const output = transpileCurl(
      "curl -H 'X-Note: it'\\''s fine' https://api.example.com/echo",
      "powershell",
    );
    expect(output).toContain("'X-Note' = 'it''s fine'");
  });

  it("falls back to a single-quoted literal when the body would close the here-string", () => {
    const request: Parameters<typeof generatePowershell>[0] = {
      method: "POST",
      url: "https://api.example.com/echo",
      headers: { "Content-Type": "text/plain" },
      data: "line1\n'@ closes the here-string",
      auth: null,
      isJson: false,
    };
    const output = generatePowershell(request);
    expect(output).not.toContain("@'\n");
    expect(output).toContain("Body        = 'line1\n''@ closes the here-string'");
  });
});

describe("httpie generator", () => {
  it("emits a bare http command for GET requests", () => {
    const output = transpileCurl(
      "curl 'https://api.example.com/users?limit=5'",
      "httpie",
    );
    expect(output).toContain("http 'https://api.example.com/users?limit=5'");
    expect(output).not.toContain("GET");
  });

  it("includes the method for non-GET verbs", () => {
    const output = transpileCurl(
      "curl -X DELETE https://api.example.com/todos/42",
      "httpie",
    );
    expect(output.startsWith("http DELETE ")).toBe(true);
  });

  it("converts flat JSON bodies to key=value and key:=value items", () => {
    const command = [
      "curl -X POST https://api.example.com/todos",
      " -H 'Content-Type: application/json'",
      " --data-raw '{\"title\": \"Ship it\", \"done\": false, \"order\": 3}'",
    ].join(" ");
    const output = transpileCurl(command, "httpie");
    expect(output).toContain("title='Ship it'");
    expect(output).toContain("done:=false");
    expect(output).toContain("order:=3");
    // Content-Type handled by HTTPie itself when items are present
    expect(output).not.toContain("Content-Type");
  });

  it("falls back to --raw for non-object JSON bodies", () => {
    const command = [
      "curl -X POST https://api.example.com/batch",
      " -H 'Content-Type: application/json'",
      " --data-raw '[1, 2, 3]'",
    ].join(" ");
    const output = transpileCurl(command, "httpie");
    expect(output).toContain("--raw '[1, 2, 3]'");
  });

  it("keeps Content-Type for non-JSON bodies and passes them via --raw", () => {
    const output = transpileCurl(
      "curl -X POST https://api.example.com/echo -H 'Content-Type: text/plain' -d 'hello world'",
      "httpie",
    );
    expect(output).toContain("Content-Type:'text/plain'");
    expect(output).toContain("--raw 'hello world'");
  });

  it("maps basic auth to --auth", () => {
    const output = transpileCurl(
      "curl -u admin:s3cr3t https://api.example.com/stats",
      "httpie",
    );
    expect(output).toContain("--auth 'admin:s3cr3t'");
  });

  it("converts headers to Name:value tokens with safe quoting", () => {
    const output = transpileCurl(
      "curl -H 'Authorization: Bearer tok' -H 'Accept: application/json' https://api.example.com",
      "httpie",
    );
    expect(output).toContain("Authorization:'Bearer tok'");
    expect(output).toContain("Accept:'application/json'");
  });
});
