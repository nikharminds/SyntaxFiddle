export interface JwtSection {
  raw: string;
  decoded: string;
  json: Record<string, unknown>;
}

export interface ParsedJWT {
  header: JwtSection;
  payload: JwtSection;
  signature: string;
}

export type JwtSegmentName = "header" | "payload" | "signature";

export type JwtErrorCode =
  | "empty"
  | "token-too-large"
  | "invalid-structure"
  | "invalid-base64url"
  | "invalid-json";

export class JWTError extends Error {
  readonly code: JwtErrorCode;
  readonly segment: JwtSegmentName | null;

  constructor(code: JwtErrorCode, message: string, segment: JwtSegmentName | null = null) {
    super(message);
    this.name = "JWTError";
    this.code = code;
    this.segment = segment;
  }
}

export function isJWTError(value: unknown): value is JWTError {
  return value instanceof Error && value.name === "JWTError";
}

export const MAX_TOKEN_LENGTH = 1_000_000;

const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const BEARER_PREFIX_PATTERN = /^Bearer\s+/i;
const utf8Decoder = new TextDecoder("utf-8");

function decodeBase64Url(segment: string, name: JwtSegmentName): Uint8Array | JWTError {
  if (!BASE64URL_PATTERN.test(segment)) {
    return new JWTError(
      "invalid-base64url",
      `The ${name} segment contains characters outside the base64url alphabet (A-Z, a-z, 0-9, -, _). Remove line breaks, spaces, or stray characters and try again.`,
      name,
    );
  }
  if (segment.length % 4 === 1) {
    return new JWTError(
      "invalid-base64url",
      `The ${name} segment has an invalid base64url length and cannot be decoded.`,
      name,
    );
  }
  const padded =
    segment.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (segment.length % 4)) % 4);
  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    return new JWTError(
      "invalid-base64url",
      `The ${name} segment could not be decoded as base64url.`,
      name,
    );
  }
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function decodeSegment(raw: string, name: "header" | "payload"): JwtSection | JWTError {
  const bytes = decodeBase64Url(raw, name);
  if (!(bytes instanceof Uint8Array)) {
    return bytes;
  }
  const decoded = utf8Decoder.decode(bytes);
  let parsed: unknown;
  try {
    parsed = JSON.parse(decoded);
  } catch (error) {
    return new JWTError(
      "invalid-json",
      `The ${name} segment does not contain valid JSON (${error instanceof Error ? error.message : String(error)}).`,
      name,
    );
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return new JWTError(
      "invalid-json",
      `The ${name} segment must decode to a JSON object, but found ${Array.isArray(parsed) ? "an array" : typeof parsed}.`,
      name,
    );
  }
  return { raw, decoded, json: parsed as Record<string, unknown> };
}

export type DecodeJWTResult = ParsedJWT | JWTError;

export function decodeJWT(token: string): DecodeJWTResult {
  if (typeof token !== "string" || token.trim().length === 0) {
    return new JWTError("empty", "Paste a JWT first — the input is empty.");
  }
  if (token.length > MAX_TOKEN_LENGTH) {
    return new JWTError(
      "token-too-large",
      `Token exceeds the ${MAX_TOKEN_LENGTH.toLocaleString()} character client-side limit.`,
    );
  }
  const cleaned = token.trim().replace(BEARER_PREFIX_PATTERN, "");
  const parts = cleaned.split(".");
  if (parts.length !== 3) {
    return new JWTError(
      "invalid-structure",
      `A JWT must have exactly 3 dot-separated segments (header.payload.signature) — found ${parts.length}.`,
    );
  }
  const rawHeader = parts[0];
  const rawPayload = parts[1];
  const rawSignature = parts[2];
  if (rawHeader === undefined || rawHeader.length === 0) {
    return new JWTError("invalid-structure", "The header segment is empty.", "header");
  }
  if (rawPayload === undefined || rawPayload.length === 0) {
    return new JWTError("invalid-structure", "The payload segment is empty.", "payload");
  }
  if (rawSignature === undefined) {
    return new JWTError("invalid-structure", "The signature segment is missing.", "signature");
  }
  if (rawSignature.length > 0 && !BASE64URL_PATTERN.test(rawSignature)) {
    return new JWTError(
      "invalid-base64url",
      "The signature segment contains characters outside the base64url alphabet (A-Z, a-z, 0-9, -, _).",
      "signature",
    );
  }
  const header = decodeSegment(rawHeader, "header");
  if (header instanceof JWTError) {
    return header;
  }
  const payload = decodeSegment(rawPayload, "payload");
  if (payload instanceof JWTError) {
    return payload;
  }
  return { header, payload, signature: rawSignature };
}
