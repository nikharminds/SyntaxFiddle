import { formatSOQL } from "../lib/formatters/soql";
import type {
  SoqlWorkerRequest,
  SoqlWorkerResponse,
} from "../lib/formatters/soql-protocol";

/**
 * Formats SOQL off the main thread so multi-megabyte queries never freeze
 * the UI. Every request is answered with a matching { id, ok } response.
 */
const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<SoqlWorkerRequest>) => void) | null;
  postMessage(message: SoqlWorkerResponse): void;
};

ctx.onmessage = (event: MessageEvent<SoqlWorkerRequest>) => {
  const message = event.data;
  try {
    const started = performance.now();
    const output = formatSOQL(message.query, message.options);
    ctx.postMessage({
      id: message.id,
      ok: true,
      output,
      durationMs: performance.now() - started,
    });
  } catch (error) {
    ctx.postMessage({
      id: message.id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
