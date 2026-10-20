import { runRegex } from "../lib/regex/engine";
import type { RegexWorkerRequest, RegexWorkerResponse } from "../lib/regex/protocol";

const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<RegexWorkerRequest>) => void) | null;
  postMessage(message: RegexWorkerResponse): void;
};

ctx.onmessage = (event: MessageEvent<RegexWorkerRequest>) => {
  const message = event.data;
  try {
    const result = runRegex(message.pattern, message.flags, message.testString);
    ctx.postMessage({ id: message.id, ...result });
  } catch (error) {
    ctx.postMessage({
      id: message.id,
      ok: false,
      code: "worker-error",
      message: error instanceof Error ? error.message : String(error),
      durationMs: 0,
    });
  }
};
