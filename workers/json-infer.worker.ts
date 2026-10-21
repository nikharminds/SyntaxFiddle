import { generateSchema } from "../lib/json-schema";
import { diagnoseJsonSyntax } from "../lib/json-schema/diagnostics";
import type {
  JsonInferRequest,
  JsonInferResponse,
} from "../lib/json-schema/protocol";

const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<JsonInferRequest>) => void) | null;
  postMessage(message: JsonInferResponse): void;
};

ctx.onmessage = (event: MessageEvent<JsonInferRequest>) => {
  const message = event.data;
  if (message.type !== "infer") return;
  const started = performance.now();
  const syntax = diagnoseJsonSyntax(message.json);
  if (syntax) {
    ctx.postMessage({
      id: message.id,
      ok: false,
      error: { kind: "syntax", detail: syntax },
    });
    return;
  }
  try {
    const code = generateSchema(message.json, message.target, message.rootName);
    ctx.postMessage({
      id: message.id,
      ok: true,
      code,
      durationMs: Math.max(1, Math.round(performance.now() - started)),
      inputBytes: new TextEncoder().encode(message.json).length,
      outputLines: code.split("\n").length,
    });
  } catch (error) {
    ctx.postMessage({
      id: message.id,
      ok: false,
      error: {
        kind: "runtime",
        message: error instanceof Error ? error.message : String(error),
      },
    });
  }
};
