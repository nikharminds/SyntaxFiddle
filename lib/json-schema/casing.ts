const IDENTIFIER_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

export function splitKeyWords(key: string): string[] {
  const normalized = key.replace(/[^A-Za-z0-9]+/g, " ");
  const words: string[] = [];
  let buffer = "";
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i] as string;
    if (char === " ") {
      if (buffer) {
        words.push(buffer);
        buffer = "";
      }
      continue;
    }
    if (buffer) {
      const prev = normalized[i - 1] as string;
      const isUpper = char >= "A" && char <= "Z";
      const prevUpper = prev >= "A" && prev <= "Z";
      const prevLowerOrDigit =
        (prev >= "a" && prev <= "z") || (prev >= "0" && prev <= "9");
      const next = i + 1 < normalized.length ? normalized[i + 1] : undefined;
      const nextLower = next !== undefined && next >= "a" && next <= "z";
      if (isUpper && (prevLowerOrDigit || (prevUpper && nextLower))) {
        words.push(buffer);
        buffer = "";
      }
    }
    buffer += char;
  }
  if (buffer) words.push(buffer);
  return words;
}

function normalizeWord(word: string): string {
  if (word.length > 1 && word === word.toUpperCase()) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function toCamelCase(key: string): string {
  const words = splitKeyWords(key);
  if (words.length === 0) return "";
  const head = words[0] as string;
  return head.toLowerCase() + words.slice(1).map(normalizeWord).join("");
}

export function toPascalCase(key: string): string {
  return splitKeyWords(key).map(normalizeWord).join("");
}

export function toSnakeCase(key: string): string {
  return splitKeyWords(key)
    .map((word) => word.toLowerCase())
    .join("_");
}

export function isIdentifier(name: string): boolean {
  return IDENTIFIER_PATTERN.test(name);
}
