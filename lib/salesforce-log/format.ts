/** Display formatters shared by the Salesforce debug-log analyzer panels. */

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 ** 3)).toFixed(2)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 ** 2)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
}

export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

/** Microsecond log offsets ("(11244890)") rendered as milliseconds/seconds. */
export function formatUsToMs(microseconds: number): string {
  const ms = microseconds / 1000;
  if (ms >= 1000) {
    return `${(ms / 1000).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} s`;
  }
  return `${ms.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} ms`;
}
