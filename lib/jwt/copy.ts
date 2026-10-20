export type JwtSeoSection = {
  heading: string;
  body: string[];
};

const SECTIONS: JwtSeoSection[] = [
  {
    heading: "Base64Url: the encoding every JWT is built on",
    body: [
      "A JWT is encoded, never encrypted — that distinction is the foundation of everything about tokens. Classic Base64 maps every three bytes of input onto four characters drawn from A–Z, a–z, 0–9, plus two characters that are hostile to URLs: + and /, with trailing = signs padding the output to a multiple of four. The Base64Url variant standardized in RFC 4648 section 5 fixes exactly that: + becomes -, / becomes _, and the padding is stripped entirely. Those substitutions are what make a token safe to drop into a query string, an Authorization header, or a cookie without percent-encoding mangling it — and they are why real-world tokens so often end in a bare character instead of an = sign.",
      "Decoding is a lossless, purely local operation: Base64Url back to raw bytes, then the bytes interpreted as UTF-8. This decoder performs that pipeline explicitly — it converts the output of atob() into a Uint8Array before handing it to TextDecoder, so multibyte characters in claims such as names, roles written in non-Latin scripts, or embedded Unicode punctuation survive intact. A naive decode that stops at the ASCII binary string mangles those bytes into mojibake. And because encoding is reversible without any key, anyone holding the token can read the entire payload — which is precisely why the privacy of the tool you paste it into matters.",
    ],
  },
  {
    heading: "Anatomy of the three dot-separated segments",
    body: [
      "The compact JWS serialization is three Base64Url segments joined by dots: header.payload.signature. The header is a tiny JSON object — typically {\"alg\":\"HS256\",\"typ\":\"JWT\"} — where alg names the signing algorithm (HS256 for HMAC-SHA256, RS256 or ES256 for asymmetric RSA and ECDSA) and typ declares the media type. Decoders read the header first because it states what the signature is supposed to be, which is also why an attacker flipping alg to none is a classic pitfall for naive verifiers.",
      "The payload carries the claims. Registered claims are a small reserved vocabulary: iss (issuer), sub (subject), aud (audience), exp (expiration), nbf (not-before), iat (issued-at), and jti (a unique token id). The three time claims are NumericDates — seconds since the Unix epoch, not ISO strings — which is exactly what this tool's expiry badge evaluates. Around them sit your private claims: user id, roles, tenant, plan, anything your services agreed on.",
      "The third segment is not JSON at all. It is the Base64Url encoding of a cryptographic output — an HMAC, ECDSA, or RSA signature computed over the ASCII bytes of the first two segments plus the joining dot. Because that output is raw binary, decoding it as text yields garbage, which is why this tool deliberately displays the signature segment untouched. Unsecured alg=none tokens legitimately carry an empty third segment; the decoder accepts that shape rather than rejecting it as malformed.",
    ],
  },
  {
    heading: "Why pasting JWTs into server-backed decoders is a security risk",
    body: [
      "An access token is a bearer credential: whoever presents it, gets in. Every server-backed \"paste your JWT here\" site receives that credential in an HTTP request body, at which point it can end up in access logs, APM payload captures, exception trackers, analytics pipelines, and the operator's database — none of which you can audit. The transport may be HTTPS, but TLS protects the pipe, not the recipient. A tool whose entire value proposition is \"inspect your real token\" should never require a server to do it.",
      "The blast radius of a leak is asymmetric, too. Stateless JWTs have no server-side session to invalidate: revoking a leaked token usually means waiting for exp to pass or rotating the signing key and invalidating every token in circulation. Long-lived refresh tokens and tokens with generous expiry windows amplify the damage. This decoder is a static site with no backend to leak to — the token you paste is parsed by JavaScript running in your tab and never transmitted anywhere. You can verify that yourself in seconds: open the Network panel, paste a token, and watch the request count stay at zero.",
    ],
  },
  {
    heading: "Decode-only by design: why the signature is never verified",
    body: [
      "Verifying a signature requires the key — the HMAC secret shared with the issuer, or the issuer's public key fetched from its JWKS endpoint. A browser tool has neither, and a trustworthy one refuses to pretend otherwise; this one labels itself decode-only and shows an explicit Signature Not Verified badge instead of a false green check. The correct workflow is layered: decode here to inspect structure and claims, validate what needs no key (exp, nbf, aud, iss, claim shapes), and verify the signature where the key actually lives — your backend middleware or a vetted JWT library pointed at the issuer's JWKS.",
      "It is equally important to internalize what the signature is not: it is tamper-evidence, not confidentiality. A correctly signed token's payload is still fully readable by anyone who captures it — signing protects integrity only. That makes claims hygiene a security control: never place passwords, API keys, session secrets, or personal data you would not broadcast into a payload. If tokens themselves must be opaque, the JWT family has an answer — JWE (encrypted tokens) — but those are a different, five-segment serialization that this compact-JWS decoder will flag as structurally invalid rather than mislead you about.",
    ],
  },
  {
    heading: "Expiry, clock skew, and claim hygiene",
    body: [
      "Time claims deserve special attention because they are the most common source of subtle auth bugs. exp, nbf, and iat are all NumericDates — integer or fractional seconds since 1970-01-01 UTC. A token that fails validation \"randomly\" across servers is usually clock skew: issuers and verifiers disagree by a few seconds or minutes, so production verifiers allow a small leeway window (commonly 30–60 seconds) around exp and nbf. The live expiry badge in this tool computes against your browser's clock, which is a quick sanity check when debugging exactly that class of failure.",
      "Size and audience discipline round out the hygiene checklist. Tokens ride in every request header, and HTTP infrastructure commonly caps headers around 8KB — cookies cap at 4KB each — so bloated claims silently break mobile clients and proxies. Keep payloads to identity essentials, use aud to stop a token minted for service A from being replayed at service B, and add jti when you need replay detection. Paste a token above and every one of these claims is decoded, color-coded, and readable in under a second — entirely on your machine.",
    ],
  },
];

export const JWT_FAQS = [
  {
    question: "Is it safe to paste my real JWT into this decoder?",
    answer:
      "Yes. The tool is a static site with no backend: your token is split, Base64Url-decoded, and JSON-parsed entirely by JavaScript running in your browser tab. No network request is made with your token at any point, and there is no server that could log it. You can confirm this yourself by opening your browser's Network panel and watching it stay empty while you paste and edit.",
  },
  {
    question: "Does this tool verify my token's signature?",
    answer:
      "No — it is deliberately decode-only. Signature verification requires the issuer's HMAC secret or public key, which a browser tool does not have and should not fake. Use the decoder to inspect structure and claims, then verify the signature in your backend or a vetted JWT library against the issuer's JWKS endpoint.",
  },
  {
    question: "How can the payload be readable if the token is signed?",
    answer:
      "Because signing provides integrity, not confidentiality. The signature proves the payload was not modified by anyone without the key, but the payload itself is plain Base64Url-encoded JSON that anyone can decode. Treat every claim as public: never put passwords, API keys, or sensitive personal data in a JWT payload.",
  },
  {
    question: "What does the third segment (the signature) decode to?",
    answer:
      "Raw cryptographic output, not text. It is the Base64Url encoding of an HMAC-SHA256, ECDSA, or RSA signature computed over the first two segments. Decoding it as UTF-8 produces binary noise, which is why this tool displays the signature segment as-is instead of pretending it is readable JSON.",
  },
  {
    question: "My token shows an 'invalid structure' error — what is wrong?",
    answer:
      "Most often the token was truncated by a copy that missed the final characters, or it contains line breaks or stray spaces from email or terminal wrapping. A compact JWS must have exactly three dot-separated Base64Url segments. If you see five segments you are holding an encrypted JWE token, which this decoder does not unpack. The error message names the failing segment so you can fix it precisely.",
  },
  {
    question: "How does the expiry (exp) check work?",
    answer:
      "The decoder reads the exp claim — a NumericDate in seconds since the Unix epoch — converts it to a date, and compares it against your browser's current time to show an Expired or Active badge. Note that production verifiers usually allow 30–60 seconds of clock-skew leeway around exp and nbf, so a token that is seconds from expiry may still be accepted by your backend.",
  },
];

export function buildJwtSeoSections(): JwtSeoSection[] {
  return SECTIONS;
}
