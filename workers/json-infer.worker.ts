import { generateSchema } from "../lib/json-schema";
import { diagnoseXmlSyntax, generateSchemaFromXml } from "../lib/xml-schema/parser";
import { diagnoseJsonSyntax } from "../lib/json-schema/diagnostics";
import type {
  InferRequest,
  JsonInferResponse,
} from "../lib/json-schema/protocol";

const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<InferRequest>) => void) | null;
  postMessage(message: JsonInferResponse): void;
};

ctx.onmessage = (event: MessageEvent<InferRequest>) => {
  const message = event.data;
  const started = performance.now();

  if (message.type === "infer-xml") {
    const syntax = diagnoseXmlSyntax(message.xml);
    if (syntax) {
      ctx.postMessage({
        id: message.id,
        ok: false,
        error: { kind: "syntax", detail: syntax },
      });
      return;
    }
    try {
      const code = generateSchemaFromXml(message.xml, message.target, message.rootName);
      ctx.postMessage({
        id: message.id,
        ok: true,
        code,
        durationMs: Math.max(1, Math.round(performance.now() - started)),
        inputBytes: new TextEncoder().encode(message.xml).length,
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
    return;
  }

  if (message.type !== "infer") return;
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
