import { generateSchema } from "../lib/json-schema";
import { diagnoseXmlSyntax, generateSchemaFromXml } from "../lib/xml-schema/parser";
import { diagnoseJsonSyntax } from "../lib/json-schema/diagnostics";
import { generateApexClasses } from "../lib/apex-generator";
import type {
  ApexGenerateRequest,
  ApexGenerateResponse,
} from "../lib/apex-generator/protocol";
import type {
  InferRequest,
  JsonInferResponse,
} from "../lib/json-schema/protocol";

const ctx = self as unknown as {
  onmessage:
    | ((event: MessageEvent<InferRequest | ApexGenerateRequest>) => void)
    | null;
  postMessage(message: JsonInferResponse | ApexGenerateResponse): void;
};

ctx.onmessage = (
  event: MessageEvent<InferRequest | ApexGenerateRequest>,
) => {
  const message = event.data;
  const started = performance.now();

  if (message.type === "generate-apex") {
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
      const result = generateApexClasses(message.json, message.options);
      ctx.postMessage({
        id: message.id,
        ok: true,
        apex: result.apex,
        className: result.className,
        innerClassCount: result.innerClassCount,
        durationMs: Math.max(1, Math.round(performance.now() - started)),
        inputBytes: new TextEncoder().encode(message.json).length,
        outputLines: result.lineCount,
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
    const code = generateSchemaFromXml(message.xml, message.target, message.rootName, {
      keyCasing: message.keyCasing,
    });
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
    const code = generateSchema(message.json, message.target, message.rootName, {
      keyCasing: message.keyCasing,
    });
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
