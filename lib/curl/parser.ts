export interface ParsedCurlRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  data?: string | null;
  auth?: { user: string; pass: string } | null;
  isJson: boolean;
}

export class CurlParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CurlParseError";
  }
}

export function isCurlParseError(error: unknown): error is CurlParseError {
  return error instanceof Error && error.name === "CurlParseError";
}

interface ShellToken {
  value: string;
  quoted: boolean;
}

const ANSI_C_ESCAPES: Record<string, string> = {
  n: "\n",
  t: "\t",
  r: "\r",
  "\\": "\\",
  "'": "'",
  '"': '"',
  e: "\x1b",
  a: "\a",
  b: "\b",
  f: "\f",
  v: "\v",
  "0": "\0",
};

const CURL_BINARY_PATTERN = /(?:^|\/)curl(?:\.exe)?$/i;
const LINE_CONTINUATION_PATTERN = /\\\r?\n/g;
const CMD_CARET_CONTINUATION_PATTERN = /\^\r?\n/g;
const CARRIAGE_RETURN_PATTERN = /\r/g;
const URL_SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//;
const URL_USERINFO_PATTERN = /^([a-zA-Z][a-zA-Z0-9+.-]*:\/\/)([^/?#@]+)@/;
const DOMAIN_LIKE_PATTERN = /^(?:www\.|localhost\b|[\w-]+(?:\.[\w-]+)+[/:?#]|[\w-]+(?:\.[\w-]+)+$)/i;

const METHOD_FLAGS = new Set(["-X", "--request"]);
const HEADER_FLAGS = new Set(["-H", "--header"]);
const DATA_FLAGS = new Set(["-d", "--data", "--data-ascii", "--data-raw", "--data-binary"]);
const URLENCODE_DATA_FLAGS = new Set(["--data-urlencode"]);
const AUTH_FLAGS = new Set(["-u", "--user"]);
const URL_FLAGS = new Set(["--url"]);
const USER_AGENT_FLAGS = new Set(["-A", "--user-agent"]);
const REFERER_FLAGS = new Set(["-e", "--referer"]);
const COOKIE_FLAGS = new Set(["-b", "--cookie"]);
const JSON_FLAGS = new Set(["--json"]);
const FORM_FLAGS = new Set(["-F", "--form", "--form-string"]);
const UPLOAD_FLAGS = new Set(["-T", "--upload-file"]);
const CONFIG_FLAGS = new Set(["-K", "--config"]);

const IGNORED_WITH_ARG_FLAGS = new Set([
  "-o",
  "--output",
  "-m",
  "--max-time",
  "--connect-timeout",
  "-x",
  "--proxy",
  "--proxy-user",
  "-c",
  "--cookie-jar",
  "-D",
  "--dump-header",
  "--retry",
  "--retry-delay",
  "--retry-max-time",
  "-w",
  "--write-out",
  "--cacert",
  "--cert",
  "--cert-type",
  "--key",
  "--key-type",
  "--capath",
  "--ciphers",
  "--resolve",
  "--interface",
  "-r",
  "--range",
  "-P",
  "--ftp-port",
  "-Q",
  "--quote",
  "-z",
  "--time-cond",
  "-y",
  "--speed-limit",
  "-Y",
  "--speed-time",
  "--trace",
  "--trace-ascii",
  "--libcurl",
  "--engine",
  "--mail-from",
  "--mail-rcpt",
  "--etag-compare",
  "--etag-save",
  "--curves",
  "--tlsauthtype",
  "--tlsuser",
  "--tlspassword",
  "--login-options",
  "--sasl-authzid",
  "--hsts",
  "--alt-service",
  "--doh-url",
  "--limit-rate",
  "--expect100-timeout",
  "--happy-eyeballs-timeout-ms",
  "--upkeep-interval-ms",
]);

const COMBINED_SAFE_SHORTS = new Set([
  "k",
  "s",
  "S",
  "L",
  "i",
  "v",
  "f",
  "q",
  "g",
  "n",
  "N",
  "4",
  "6",
  "a",
  "B",
  "#",
]);

const SHORTS_WITH_ARG = new Set([
  "X",
  "H",
  "d",
  "u",
  "A",
  "e",
  "b",
  "F",
  "T",
  "K",
  "o",
  "m",
  "x",
  "c",
  "D",
  "w",
  "r",
  "P",
  "Q",
  "z",
  "y",
  "Y",
  "J",
  "E",
  "Z",
]);

function readWord(source: string, start: number): { token: ShellToken; end: number } {
  const chars: string[] = [];
  let quoted = false;
  let i = start;

  while (i < source.length) {
    const char = source[i]!;
    if (/\s/.test(char)) break;

    if (char === "'") {
      quoted = true;
      i++;
      let closed = false;
      while (i < source.length) {
        const c = source[i]!;
        if (c === "\\" && source[i + 1] === "'") {
          chars.push("'");
          i += 2;
          continue;
        }
        if (c === "'") {
          closed = true;
          i++;
          break;
        }
        chars.push(c);
        i++;
      }
      if (!closed) {
        throw new CurlParseError(
          "Unterminated single quote. Every opening ' needs a matching closing '.",
        );
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
      i++;
      let closed = false;
      while (i < source.length) {
        const c = source[i]!;
        if (c === "\\") {
          const next = source[i + 1];
          if (next === '"' || next === "\\" || next === "$" || next === "`") {
            chars.push(next);
            i += 2;
            continue;
          }
          if (next === "\n") {
            i += 2;
            continue;
          }
          chars.push(c);
          i++;
          continue;
        }
        if (c === '"') {
          closed = true;
          i++;
          break;
        }
        chars.push(c);
        i++;
      }
      if (!closed) {
        throw new CurlParseError(
          'Unterminated double quote. Every opening " needs a matching closing ".',
        );
      }
      continue;
    }

    if (char === "$" && source[i + 1] === "'") {
      quoted = true;
      i += 2;
      let closed = false;
      while (i < source.length) {
        const c = source[i]!;
        if (c === "\\") {
          const next = source[i + 1];
          if (next === undefined) {
            throw new CurlParseError(
              "Unterminated $'...' quoted string. Every opening $' needs a matching closing '.",
            );
          }
          chars.push(ANSI_C_ESCAPES[next] ?? next);
          i += 2;
          continue;
        }
        if (c === "'") {
          closed = true;
          i++;
          break;
        }
        chars.push(c);
        i++;
      }
      if (!closed) {
        throw new CurlParseError(
          "Unterminated $'...' quoted string. Every opening $' needs a matching closing '.",
        );
      }
      continue;
    }

    if (char === "\\" && i + 1 < source.length) {
      chars.push(source[i + 1]!);
      i += 2;
      continue;
    }

    chars.push(char);
    i++;
  }

  return { token: { value: chars.join(""), quoted }, end: i };
}

function tokenize(input: string): ShellToken[] {
  const source = input
    .replace(LINE_CONTINUATION_PATTERN, "")
    .replace(CMD_CARET_CONTINUATION_PATTERN, "")
    .replace(CARRIAGE_RETURN_PATTERN, "");

  const tokens: ShellToken[] = [];
  let i = 0;
  while (i < source.length) {
    if (/\s/.test(source[i]!)) {
      i++;
      continue;
    }
    const { token, end } = readWord(source, i);
    tokens.push(token);
    i = end;
  }
  return tokens;
}

function looksLikeJson(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return false;
  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

function appendToQuery(url: string, query: string): string {
  if (!query) return url;
  if (url.endsWith("?") || url.endsWith("&")) return url + query;
  return url + (url.includes("?") ? "&" : "?") + query;
}

function encodeDataUrlencodePart(flag: string, raw: string): string {
  if (raw.startsWith("@")) {
    throw new CurlParseError(
      `The flag "${flag}" with "${raw}" reads data from a file, which is not supported in a client-side converter.`,
    );
  }
  const equals = raw.indexOf("=");
  if (equals === -1) return encodeURIComponent(raw);
  if (equals === 0) return encodeURIComponent(raw.slice(1));
  return `${raw.slice(0, equals)}=${encodeURIComponent(raw.slice(equals + 1))}`;
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function parseCurl(command: string): ParsedCurlRequest {
  const trimmedInput = command.trim();
  if (!trimmedInput) {
    throw new CurlParseError("The cURL command is empty. Paste a command like: curl https://api.example.com/todos");
  }

  const tokens = tokenize(trimmedInput);
  if (tokens.length === 0) {
    throw new CurlParseError("The cURL command is empty. Paste a command like: curl https://api.example.com/todos");
  }

  let index = 0;
  const first = tokens[0]!;
  if (!first.quoted && CURL_BINARY_PATTERN.test(first.value)) {
    index = 1;
  }

  let method: string | null = null;
  let urlFromFlag: string | null = null;
  const headerMap = new Map<string, { name: string; value: string }>();
  const dataParts: string[] = [];
  let auth: { user: string; pass: string } | null = null;
  let forceGet = false;
  let headRequest = false;
  let jsonFlag = false;
  let optionsEnded = false;
  const positionals: string[] = [];

  const setHeader = (name: string, value: string) => {
    headerMap.set(name.toLowerCase(), { name, value });
  };

  while (index < tokens.length) {
    const token = tokens[index]!;
    const raw = token.value;

    if (optionsEnded || !raw.startsWith("-") || raw === "-") {
      if (raw !== "-") positionals.push(raw);
      index++;
      continue;
    }

    if (raw === "--") {
      optionsEnded = true;
      index++;
      continue;
    }

    if (raw.length > 2 && !raw.startsWith("--")) {
      const letters = raw.slice(1).split("");
      if (letters.every((letter) => COMBINED_SAFE_SHORTS.has(letter))) {
        index++;
        continue;
      }
      if (letters.some((letter) => SHORTS_WITH_ARG.has(letter) || letter === "G" || letter === "I")) {
        throw new CurlParseError(
          `The flag group "${raw}" mixes short options that take separate values, which cannot be converted reliably. Expand it into separate flags.`,
        );
      }
      index++;
      continue;
    }

    let name = raw;
    let inlineValue: string | null = null;
    if (raw.startsWith("--")) {
      const equals = raw.indexOf("=");
      if (equals !== -1) {
        name = raw.slice(0, equals);
        inlineValue = raw.slice(equals + 1);
      }
    }

    const nextValue = (): string => {
      if (inlineValue !== null) return inlineValue;
      const next = tokens[index + 1];
      if (!next) {
        throw new CurlParseError(`The flag "${name}" expects a value, but none was provided.`);
      }
      index++;
      return next.value;
    };

    if (METHOD_FLAGS.has(name)) {
      const value = nextValue().trim().toUpperCase();
      if (!value) {
        throw new CurlParseError(`The flag "${name}" received an empty HTTP method.`);
      }
      method = value;
    } else if (HEADER_FLAGS.has(name)) {
      const value = nextValue();
      const colon = value.indexOf(":");
      if (colon === -1) {
        throw new CurlParseError(
          `Invalid header "${value}". Headers must use the form "Name: Value".`,
        );
      }
      const headerName = value.slice(0, colon).trim();
      if (!headerName) {
        throw new CurlParseError(
          `Invalid header "${value}". The header name before the colon is empty.`,
        );
      }
      let headerValue = value.slice(colon + 1).trim();
      if (headerValue.endsWith(";")) {
        headerValue = headerValue.slice(0, -1).trim();
      }
      if (!headerValue) {
        headerMap.delete(headerName.toLowerCase());
      } else {
        setHeader(headerName, headerValue);
      }
    } else if (DATA_FLAGS.has(name)) {
      const value = nextValue();
      const readsLiteralAt = name === "--data-raw";
      if (!readsLiteralAt) {
        if (value === "@-") {
          throw new CurlParseError(
            `The flag "${name} @-" reads the request body from stdin, which is not supported in a client-side converter.`,
          );
        }
        if (value.startsWith("@")) {
          throw new CurlParseError(
            `The flag "${name} ${value}" reads the request body from a file, which is not supported in a client-side converter.`,
          );
        }
      }
      dataParts.push(value);
    } else if (URLENCODE_DATA_FLAGS.has(name)) {
      dataParts.push(encodeDataUrlencodePart(name, nextValue()));
    } else if (AUTH_FLAGS.has(name)) {
      const value = nextValue();
      const colon = value.indexOf(":");
      auth = {
        user: colon === -1 ? value : value.slice(0, colon),
        pass: colon === -1 ? "" : value.slice(colon + 1),
      };
    } else if (URL_FLAGS.has(name)) {
      urlFromFlag = nextValue();
    } else if (USER_AGENT_FLAGS.has(name)) {
      setHeader("User-Agent", nextValue());
    } else if (REFERER_FLAGS.has(name)) {
      setHeader("Referer", nextValue());
    } else if (COOKIE_FLAGS.has(name)) {
      const value = nextValue();
      if (value.startsWith("@")) {
        throw new CurlParseError(
          `The flag "${name} ${value}" reads cookies from a file, which is not supported in a client-side converter.`,
        );
      }
      setHeader("Cookie", value);
    } else if (JSON_FLAGS.has(name)) {
      jsonFlag = true;
      dataParts.push(nextValue());
    } else if (FORM_FLAGS.has(name)) {
      throw new CurlParseError(
        `The flag "${name}" builds multipart form data, which requires file access and is not supported in a client-side converter. Use -d/--data instead.`,
      );
    } else if (UPLOAD_FLAGS.has(name)) {
      throw new CurlParseError(
        `The flag "${name}" uploads a file from disk, which is not supported in a client-side converter.`,
      );
    } else if (CONFIG_FLAGS.has(name)) {
      throw new CurlParseError(
        `The flag "${name}" loads settings from an external config file, which is not supported in a client-side converter.`,
      );
    } else if (name === "-G" || name === "--get") {
      forceGet = true;
    } else if (name === "-I" || name === "--head") {
      headRequest = true;
    } else if (IGNORED_WITH_ARG_FLAGS.has(name)) {
      if (inlineValue === null) {
        const next = tokens[index + 1];
        if (!next) {
          throw new CurlParseError(`The flag "${name}" expects a value, but none was provided.`);
        }
        index++;
      }
    }

    index++;
  }

  let url = urlFromFlag;
  if (url === null) {
    const explicit = positionals.find((candidate) => URL_SCHEME_PATTERN.test(candidate));
    const domainLike = positionals.find((candidate) => DOMAIN_LIKE_PATTERN.test(candidate));
    url = explicit ?? domainLike ?? positionals[0] ?? null;
  }
  if (!url) {
    throw new CurlParseError(
      "No URL was found in the cURL command. Include the endpoint you want to request.",
    );
  }

  const userinfo = URL_USERINFO_PATTERN.exec(url);
  if (userinfo) {
    if (!auth) {
      const credentials = userinfo[2]!;
      const colon = credentials.indexOf(":");
      auth = {
        user: safeDecodeURIComponent(colon === -1 ? credentials : credentials.slice(0, colon)),
        pass: safeDecodeURIComponent(colon === -1 ? "" : credentials.slice(colon + 1)),
      };
    }
    url = userinfo[1]! + url.slice(userinfo[0].length);
  }

  let data: string | null = dataParts.length > 0 ? dataParts.join("&") : null;

  const resolvedMethod = method ?? (headRequest ? "HEAD" : data !== null && !forceGet ? "POST" : "GET");

  if ((forceGet || resolvedMethod === "GET" || resolvedMethod === "HEAD") && data !== null) {
    url = appendToQuery(url, data);
    data = null;
  }

  if (!URL_SCHEME_PATTERN.test(url)) {
    url = `http://${url.replace(/^\/+/, "")}`;
  }

  if (data !== null && !headerMap.has("content-type")) {
    if (jsonFlag || looksLikeJson(data)) {
      setHeader("Content-Type", "application/json");
    } else {
      setHeader("Content-Type", "application/x-www-form-urlencoded");
    }
  }
  if (jsonFlag && !headerMap.has("accept")) {
    setHeader("Accept", "application/json");
  }
  headerMap.delete("content-length");

  const contentType = headerMap.get("content-type")?.value ?? "";
  const isJson = jsonFlag || contentType.toLowerCase().includes("json");

  const headers: Record<string, string> = {};
  for (const entry of headerMap.values()) {
    headers[entry.name] = entry.value;
  }

  return {
    method: resolvedMethod,
    url,
    headers,
    data,
    auth,
    isJson,
  };
}
