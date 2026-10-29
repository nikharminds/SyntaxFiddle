import {
  inferJson,
  toPascalCase,
  generateZodSchema,
  generateTypeScriptTypes,
  generatePydanticModels,
  generateGoStructs,
} from "../json-schema";
import type { SchemaTarget } from "../json-schema";
import type { SchemaOptions } from "../json-schema/options";

export interface XmlSyntaxDiagnosticDetail {
  message: string;
  line: number | null;
  column: number | null;
}

export type XmlParseResult =
  | { ok: true; value: unknown; rootName: string }
  | { ok: false; detail: XmlSyntaxDiagnosticDetail };

export const MAX_XML_DEPTH = 200;

const NAME_RE = /[A-Za-z_][\w.:-]*/y;

function lineCol(xml: string, offset: number): { line: number; column: number } {
  let line = 1;
  let last = 0;
  for (let i = 0; i < offset; i += 1) {
    if (xml.charCodeAt(i) === 10) {
      line += 1;
      last = i + 1;
    }
  }
  return { line, column: offset - last + 1 };
}

function fail(xml: string, offset: number, message: string): XmlParseResult {
  const { line, column } = lineCol(xml, offset);
  return { ok: false, detail: { message, line, column } };
}

function decodeEntities(raw: string): string {
  return raw.replace(/&([^;]*);/g, (_match, body: string) => {
    if (body === "amp") return "&";
    if (body === "lt") return "<";
    if (body === "gt") return ">";
    if (body === "quot") return '"';
    if (body === "apos") return "'";
    if (body.startsWith("#")) {
      const code = body.startsWith("#x") || body.startsWith("#X")
        ? Number.parseInt(body.slice(2), 16)
        : Number.parseInt(body.slice(1), 10);
      if (Number.isFinite(code) && code > 0 && code <= 0x10ffff) {
        try {
          return String.fromCodePoint(code);
        } catch {
          /* fall through to error below */
        }
      }
      throw new EntityError(body);
    }
    throw new EntityError(body);
  });
}

class EntityError extends Error {
  constructor(public readonly entity: string) {
    super(entity);
  }
}

interface ChildNode {
  name: string;
  value: unknown;
}

interface ElementResult {
  ok: boolean;
  message?: string;
  offset?: number;
  value?: unknown;
}

function sniffScalar(text: string): unknown {
  if (text === "true") return true;
  if (text === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(text)) {
    const num = Number(text);
    if (String(num) === text) return num;
  }
  return text;
}

function buildValue(
  attrs: Record<string, string> | null,
  children: ChildNode[],
  text: string | null,
  cdataOnly: boolean,
): unknown {
  const hasAttrs = attrs !== null && Object.keys(attrs).length > 0;
  if (children.length === 0 && !hasAttrs) {
    if (text === null) return null;
    return cdataOnly ? text : sniffScalar(text);
  }
  const record: Record<string, unknown> = {};
  if (hasAttrs && attrs) {
    for (const key of Object.keys(attrs)) record[`@${key}`] = sniffScalar(attrs[key] ?? "");
  }
  const groups = new Map<string, unknown[]>();
  for (const child of children) {
    const list = groups.get(child.name) ?? [];
    list.push(child.value);
    groups.set(child.name, list);
  }
  for (const [name, list] of groups) {
    record[name] = list.length === 1 ? list[0] : list;
  }
  if (text !== null) record["#text"] = cdataOnly ? text : sniffScalar(text);
  return record;
}

export function parseXml(xml: string): XmlParseResult {
  let i = 0;
  const len = xml.length;

  const skipMisc = (): string | null => {
    while (i < len) {
      if (/\s/.test(xml[i] ?? "")) {
        i += 1;
        continue;
      }
      if (xml.startsWith("<?", i)) {
        const end = xml.indexOf("?>", i);
        if (end === -1) return "Unterminated processing instruction";
        i = end + 2;
        continue;
      }
      if (xml.startsWith("<!--", i)) {
        const end = xml.indexOf("-->", i);
        if (end === -1) return "Unterminated comment";
        i = end + 3;
        continue;
      }
      if (xml.startsWith("<!DOCTYPE", i)) {
        const open = xml.indexOf("[", i);
        const end = xml.indexOf(">", i);
        if (end === -1) return "Unterminated DOCTYPE declaration";
        if (open !== -1 && open < end) {
          const close = xml.indexOf("]", open);
          if (close === -1) return "Unterminated DOCTYPE internal subset";
          const after = xml.indexOf(">", close);
          if (after === -1) return "Unterminated DOCTYPE declaration";
          i = after + 1;
        } else {
          i = end + 1;
        }
        continue;
      }
      return null;
    }
    return null;
  };

  const miscError = skipMisc();
  if (miscError) return fail(xml, i, miscError);
  if (i >= len || xml[i] !== "<") return fail(xml, i, "No root element found");

  let rootName: string | null = null;

  const parseElement = (depth: number): ElementResult => {
    if (depth > MAX_XML_DEPTH) {
      return { ok: false, message: `XML nesting exceeds the supported depth of ${MAX_XML_DEPTH}` };
    }
    const openStart = i;
    i += 1; // consume '<'
    NAME_RE.lastIndex = i;
    const nameMatch = NAME_RE.exec(xml);
    if (!nameMatch) return { ok: false, message: "Malformed start tag", offset: openStart };
    const name = nameMatch[0];
    i = nameMatch.index + nameMatch[0].length;
    if (rootName === null) rootName = name;

    let attrs: Record<string, string> | null = null;
    let selfClosing = false;
    for (;;) {
      while (i < len && /\s/.test(xml[i] ?? "")) i += 1;
      if (i >= len) return { ok: false, message: `Unclosed element <${name}> at end of input`, offset: openStart };
      if (xml.startsWith("/>", i)) {
        i += 2;
        selfClosing = true;
        break;
      }
      if (xml[i] === ">") {
        i += 1;
        break;
      }
      NAME_RE.lastIndex = i;
      const attrMatch = NAME_RE.exec(xml);
      if (!attrMatch) {
        return { ok: false, message: `Malformed attribute in <${name}> (attributes must be name="value")`, offset: i };
      }
      const attrName = attrMatch[0];
      i = attrMatch.index + attrMatch[0].length;
      while (i < len && /\s/.test(xml[i] ?? "")) i += 1;
      if (i >= len || xml[i] !== "=") {
        return { ok: false, message: `Attribute "${attrName}" in <${name}> has no value`, offset: i };
      }
      i += 1;
      while (i < len && /\s/.test(xml[i] ?? "")) i += 1;
      const quote = xml[i] ?? "";
      if (quote !== '"' && quote !== "'") {
        return { ok: false, message: `Attribute "${attrName}" in <${name}> must be quoted`, offset: i };
      }
      const valueStart = i + 1;
      const valueEnd = xml.indexOf(quote, valueStart);
      if (valueEnd === -1) {
        return { ok: false, message: `Unterminated attribute value in <${name}>`, offset: valueStart };
      }
      const rawValue = xml.slice(valueStart, valueEnd);
      i = valueEnd + 1;
      let decoded: string;
      try {
        const result = decodeEntities(rawValue);
        decoded = result;
      } catch (error) {
        if (error instanceof EntityError) {
          return { ok: false, message: `Unknown entity &${error.entity}; in <${name}>`, offset: valueStart };
        }
        throw error;
      }
      attrs = attrs ?? {};
      attrs[attrName] = decoded;
    }

    if (selfClosing) return { ok: true, value: buildValue(attrs, [], null, false) };

    const children: ChildNode[] = [];
    let textParts: string[] = [];
    let cdataParts: string[] = [];
    let anyCdata = false;

    for (;;) {
      if (i >= len) {
        return { ok: false, message: `Unclosed element <${name}> at end of input`, offset: openStart };
      }
      if (xml.startsWith("</", i)) {
        i += 2;
        NAME_RE.lastIndex = i;
        const closeMatch = NAME_RE.exec(xml);
        if (!closeMatch) return { ok: false, message: "Malformed closing tag", offset: i };
        const closeName = closeMatch[0];
        i = closeMatch.index + closeMatch[0].length;
        while (i < len && /\s/.test(xml[i] ?? "")) i += 1;
        if (xml[i] !== ">") return { ok: false, message: "Malformed closing tag", offset: i };
        i += 1;
        if (closeName !== name) {
          return { ok: false, message: `Mismatched closing tag: expected </${name}> but found </${closeName}>`, offset: i };
        }
        const rawText = textParts.join("");
        const trimmed = rawText.trim();
        const cdataText = cdataParts.join("");
        const meaningfulText =
          trimmed.length > 0 ? trimmed : cdataText.length > 0 ? cdataText : null;
        return {
          ok: true,
          value: buildValue(attrs, children, meaningfulText, trimmed.length === 0 && anyCdata),
        };
      }
      if (xml.startsWith("<!--", i)) {
        const end = xml.indexOf("-->", i);
        if (end === -1) return { ok: false, message: "Unterminated comment", offset: i };
        i = end + 3;
        continue;
      }
      if (xml.startsWith("<![CDATA[", i)) {
        const end = xml.indexOf("]]>", i);
        if (end === -1) return { ok: false, message: "Unterminated CDATA section", offset: i };
        cdataParts.push(xml.slice(i + 9, end));
        anyCdata = true;
        i = end + 3;
        continue;
      }
      if (xml.startsWith("<?", i)) {
        const end = xml.indexOf("?>", i);
        if (end === -1) return { ok: false, message: "Unterminated processing instruction", offset: i };
        i = end + 2;
        continue;
      }
      if (xml[i] === "<") {
        NAME_RE.lastIndex = i + 1;
        const childNameMatch = NAME_RE.exec(xml);
        if (!childNameMatch) return { ok: false, message: "Malformed start tag", offset: i };
        const childName = childNameMatch[0];
        const child = parseElement(depth + 1);
        if (!child.ok) return child;
        children.push({ name: childName, value: child.value });
        continue;
      }
      const next = xml.indexOf("<", i);
      const segment = next === -1 ? xml.slice(i) : xml.slice(i, next);
      let decodedSegment: string;
      try {
        decodedSegment = decodeEntities(segment);
      } catch (error) {
        if (error instanceof EntityError) {
          return { ok: false, message: `Unknown entity &${error.entity};`, offset: i };
        }
        throw error;
      }
      textParts.push(decodedSegment);
      i = next === -1 ? len : next;
    }
  };

  const rootResult = (() => {
    NAME_RE.lastIndex = i + 1;
    const nm = NAME_RE.exec(xml);
    return nm ? parseElement(1) : { ok: false as const, message: "Malformed start tag", offset: i };
  })();
  if (!rootResult.ok) return fail(xml, rootResult.offset ?? i, rootResult.message ?? "XML parse error");

  const trailing = skipMisc();
  if (trailing) return fail(xml, i, trailing);
  if (i < len) return fail(xml, i, "Unexpected content after the root element");

  return { ok: true, value: rootResult.value, rootName: rootName ?? "Root" };
}

export function diagnoseXmlSyntax(xml: string): XmlSyntaxDiagnosticDetail | null {
  const result = parseXml(xml);
  return result.ok ? null : result.detail;
}

export function generateSchemaFromXml(
  xml: string,
  target: SchemaTarget,
  rootName?: string,
  options?: SchemaOptions,
): string {
  const parsed = parseXml(xml);
  if (!parsed.ok) {
    throw new Error(parsed.detail.message);
  }
  const name = toPascalCase(rootName && rootName.trim().length > 0 ? rootName : parsed.rootName) || "Root";
  const definition = inferJson(JSON.stringify(parsed.value));
  switch (target) {
    case "zod":
      return generateZodSchema(definition, name, options);
    case "ts":
      return generateTypeScriptTypes(definition, name, options);
    case "pydantic":
      return generatePydanticModels(definition, name);
    case "go":
      return generateGoStructs(definition, name);
    default: {
      const exhausted: never = target;
      throw new Error(`Unsupported schema target: ${String(exhausted)}`);
    }
  }
}
