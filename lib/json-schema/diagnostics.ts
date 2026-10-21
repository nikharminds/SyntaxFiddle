export interface JsonSyntaxDiagnostic {
  message: string;
  line: number | null;
  column: number | null;
}

const POSITION_PATTERN = /position (\d+)/i;
const LINE_COLUMN_PATTERN = /line (\d+) column (\d+)/i;
const QUOTED_TOKEN_PATTERN = /unexpected token '(.+?)'/i;

function locateUnexpectedToken(raw: string, token: string): number | null {
  let index = raw.indexOf(token);
  while (index !== -1) {
    if (
      (token === "]" || token === "}") &&
      previousNonSpace(raw, index) === ","
    ) {
      return index;
    }
    index = raw.indexOf(token, index + 1);
  }
  return raw.indexOf(token) === -1 ? null : raw.indexOf(token);
}

export function diagnoseJsonSyntax(raw: string): JsonSyntaxDiagnostic | null {
  try {
    JSON.parse(raw);
    return null;
  } catch (error) {
    const engineMessage = error instanceof Error ? error.message : String(error);
    return diagnoseFromMessage(raw, engineMessage);
  }
}

export function diagnoseFromMessage(
  raw: string,
  engineMessage: string,
): JsonSyntaxDiagnostic {
  let position: number | null = null;
  const positionMatch = POSITION_PATTERN.exec(engineMessage);
  if (positionMatch) {
    position = Number(positionMatch[1]);
  } else {
    const tokenMatch = QUOTED_TOKEN_PATTERN.exec(engineMessage);
    const matchedToken = tokenMatch?.[1];
    if (matchedToken !== undefined) {
      position = locateUnexpectedToken(raw, matchedToken);
    }
  }

  let line: number | null = null;
  let column: number | null = null;
  if (position !== null) {
    const located = locate(raw, position);
    line = located.line;
    column = located.column;
  } else {
    const lineColumnMatch = LINE_COLUMN_PATTERN.exec(engineMessage);
    if (lineColumnMatch) {
      line = Number(lineColumnMatch[1]);
      column = Number(lineColumnMatch[2]);
    }
  }

  const lower = engineMessage.toLowerCase();
  const truncated =
    (position !== null && position >= raw.length) ||
    lower.includes("unexpected end of json") ||
    lower.includes("unexpected end of data");

  return {
    message: truncated
      ? "JSON is cut off — a brace, bracket, or quote is never closed"
      : hintFrom(raw, engineMessage, position),
    line,
    column,
  };
}

function locate(raw: string, position: number): { line: number; column: number } {
  let line = 1;
  let lastNewline = -1;
  const end = Math.min(position, raw.length);
  for (let i = 0; i < end; i++) {
    if (raw.charCodeAt(i) === 10) {
      line++;
      lastNewline = i;
    }
  }
  return { line, column: position - lastNewline };
}

function previousNonSpace(raw: string, position: number): string {
  for (let i = position - 1; i >= 0; i--) {
    const char = raw.charAt(i);
    if (char.trim() !== "") return char;
  }
  return "";
}

function hintFrom(
  raw: string,
  engineMessage: string,
  position: number | null,
): string {
  const lower = engineMessage.toLowerCase();
  if (
    lower.includes("expected property name") ||
    lower.includes("expected double-quoted property name")
  ) {
    return "Object keys must be double-quoted strings";
  }
  if (lower.includes("expected ',' or '}'")) {
    return "Missing comma or closing brace";
  }
  if (lower.includes("expected ',' or ']'")) {
    return "Missing comma or closing bracket";
  }
  if (lower.includes("unterminated string")) {
    return "Unclosed string — add the missing double quote";
  }
  if (lower.includes("bad escaped character")) {
    return "Invalid escape sequence — escape backslashes as \\\\";
  }
  if (lower.includes("control character")) {
    return "Raw control characters are not allowed inside strings — escape them (for example \\n)";
  }
  if (lower.includes("unexpected non-whitespace character after json")) {
    return "Trailing content after the JSON value — only one root value is allowed";
  }
  if (lower.includes("no number after minus")) {
    return "A digit was expected after the minus sign";
  }
  if (
    lower.includes("unterminated fractional") ||
    lower.includes("unterminated exponent")
  ) {
    return "A number literal is incomplete";
  }
  if (position !== null) {
    const token = raw.charAt(position);
    if (
      (token === "]" || token === "}") &&
      previousNonSpace(raw, position) === ","
    ) {
      return "Trailing commas are not allowed in JSON";
    }
    if (token === "'") {
      return "Single quotes are not valid JSON — use double quotes";
    }
    if (
      lower.includes("unexpected token") ||
      lower.includes("unexpected character") ||
      lower.includes("unexpected number") ||
      lower.includes("unexpected string")
    ) {
      return `Unexpected ${JSON.stringify(token)} in the JSON structure`;
    }
  }
  if (
    lower.includes("unexpected token") ||
    lower.includes("unexpected character")
  ) {
    return "Unexpected token in the JSON structure";
  }
  return "Invalid JSON syntax";
}
