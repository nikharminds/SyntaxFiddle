export class ConverterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConverterError";
  }
}

export function isConverterError(error: unknown): error is ConverterError {
  return error instanceof Error && error.name === "ConverterError";
}
