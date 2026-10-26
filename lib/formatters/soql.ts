/**
 * SOQL (Salesforce Object Query Language) formatter.
 *
 * Dependency-free, 100% client-side token-based formatter with native
 * understanding of Salesforce-specific syntax:
 * - parent-to-child subqueries: (SELECT ... FROM Contacts__r)
 * - relationship / custom / metadata fields: Account__r.Name, Field__c,
 *   Object__mdt, ns__Prefixed__c (kept atomic, never re-split)
 * - TYPEOF polymorphic expressions
 * - WITH SECURITY_ENFORCED / USER_MODE / SYSTEM_MODE, WITH DATA CATEGORY
 * - USING SCOPE, FOR VIEW/UPDATE/REFERENCE, ALL ROWS
 * - date & datetime literals, `LAST_N_DAYS:n` date functions, currency
 *   literals (USD500), and Apex bind variables (:var)
 *
 * No external SQL formatting libraries are used — generic SQL formatters
 * routinely mangle Salesforce field suffixes and nested subqueries.
 */

export interface FormatSOQLOptions {
  /** Indentation unit applied per nesting level. Default: four spaces. */
  indent?: string;
  /** Max items kept on one line in SELECT / GROUP BY / ORDER BY lists. Default: 3. */
  maxInlineItems?: number;
  /** Soft line width used to break short-but-long lists. Default: 100. */
  maxLineLength?: number;
}

type TokenType =
  | "word"
  | "number"
  | "string"
  | "operator"
  | "comma"
  | "open"
  | "close"
  | "bind"
  | "dateLiteral"
  | "currency"
  | "comment";

interface SoqlToken {
  type: TokenType;
  value: string;
  upper: string;
}

/* ------------------------------------------------------------------ *
 * Keyword vocabulary                                                  *
 * ------------------------------------------------------------------ */

const GENERIC_KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "GROUP", "ORDER", "BY", "HAVING", "LIMIT", "OFFSET", "WITH",
  "TYPEOF", "WHEN", "THEN", "ELSE", "END", "AND", "OR", "NOT", "IN", "LIKE", "NULL",
  "NULLS", "TRUE", "FALSE", "INCLUDES", "EXCLUDES", "ASC", "DESC", "FIRST", "LAST",
  "FOR", "ALL", "ROWS", "USING", "SCOPE", "AT", "ABOVE", "BELOW", "ABOVE_OR_BELOW",
]);

const FUNCTIONS = new Set([
  "COUNT", "COUNT_DISTINCT", "SUM", "AVG", "MIN", "MAX", "TOLABEL", "CONVERTCURRENCY",
  "GROUPING", "CUBE", "ROLLUP", "FORMAT", "DISTANCE", "GEOLOCATION",
  "CALENDAR_MONTH", "CALENDAR_QUARTER", "CALENDAR_YEAR", "DAY_IN_MONTH", "DAY_IN_WEEK",
  "DAY_IN_YEAR", "FISCAL_MONTH", "FISCAL_QUARTER", "FISCAL_YEAR", "HOUR_IN_DAY",
  "WEEK_IN_MONTH", "WEEK_IN_YEAR",
]);

const PLAIN_DATE_LITERALS = new Set<string>(["TODAY", "YESTERDAY", "TOMORROW"]);
const N_DATE_LITERALS = new Set<string>();
for (const period of ["WEEK", "MONTH", "QUARTER", "YEAR", "FISCAL_QUARTER", "FISCAL_YEAR"]) {
  for (const prefix of ["THIS", "LAST", "NEXT"]) {
    PLAIN_DATE_LITERALS.add(`${prefix}_${period}`);
  }
}
for (const unit of ["DAYS", "WEEKS", "MONTHS", "QUARTERS", "FISCAL_QUARTERS", "FISCAL_YEARS"]) {
  N_DATE_LITERALS.add(`LAST_N_${unit}`);
  N_DATE_LITERALS.add(`NEXT_N_${unit}`);
  N_DATE_LITERALS.add(`N_${unit}_AGO`);
}
const DATE_KEYWORDS = new Set<string>([...PLAIN_DATE_LITERALS, ...N_DATE_LITERALS]);

const isKeywordWord = (upper: string): boolean =>
  GENERIC_KEYWORDS.has(upper) || DATE_KEYWORDS.has(upper);

/** Words that terminate a GROUP BY / ORDER BY list scan. */
const CLAUSE_LIST_BREAKERS = new Set([
  "LIMIT", "OFFSET", "HAVING", "ORDER", "GROUP", "WITH", "FOR", "ALL", "USING", "WHERE", "FROM",
]);

/* ------------------------------------------------------------------ *
 * Tokenizer                                                           *
 * ------------------------------------------------------------------ */

const WORD_RE = /[A-Za-z_][A-Za-z0-9_]*/y;
const NUMBER_RE = /\d+(?:\.\d+)?/y;
const DATE_VALUE_RE = /\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?)?/y;
const CURRENCY_RE = /[A-Z]{3}(?=\d)/y;

/**
 * Splits raw SOQL into tokens. Field paths (`Account__r.Name`, `ns__Obj__c`,
 * `Meta__mdt`) are lexed as single atomic words so they are never re-split,
 * and date values / date functions / binds / currency literals survive intact.
 */
function tokenize(input: string): SoqlToken[] {
  const src = input;
  const tokens: SoqlToken[] = [];
  const push = (type: TokenType, value: string): void => {
    tokens.push({ type, value, upper: value.toUpperCase() });
  };

  const inValuePosition = (): boolean => {
    const prev = tokens[tokens.length - 1];
    if (!prev) return false;
    if (prev.type === "operator" || prev.type === "comma" || prev.type === "open") return true;
    if (prev.type === "word") {
      return ["IN", "NOT", "LIKE", "INCLUDES", "EXCLUDES"].includes(prev.upper);
    }
    return false;
  };

  const readWordChain = (start: number): string => {
    WORD_RE.lastIndex = start;
    const first = WORD_RE.exec(src);
    if (!first) return "";
    let value = first[0];
    let next = start + first[0].length;
    // Relationship / namespace chains: Account__r.Name, ns__Obj__c.Field__c
    while (src[next] === "." && /[A-Za-z_]/.test(src[next + 1] ?? "")) {
      WORD_RE.lastIndex = next + 1;
      const segment = WORD_RE.exec(src);
      if (!segment) break;
      value += `.${segment[0]}`;
      next = next + 1 + segment[0].length;
    }
    return value;
  };

  let pos = 0;
  while (pos < src.length) {
    const ch = src[pos]!;

    if (/\s/.test(ch)) {
      pos++;
      continue;
    }

    // Comments (preserved verbatim on their own lines)
    if (ch === "/" && src[pos + 1] === "*") {
      const end = src.indexOf("*/", pos + 2);
      const stop = end === -1 ? src.length : end + 2;
      push("comment", src.slice(pos, stop));
      pos = stop;
      continue;
    }
    if ((ch === "/" && src[pos + 1] === "/") || (ch === "-" && src[pos + 1] === "-")) {
      const end = src.indexOf("\n", pos);
      const stop = end === -1 ? src.length : end;
      push("comment", src.slice(pos, stop).replace(/\s+$/, ""));
      pos = stop;
      continue;
    }

    // String literal with backslash escapes ('O\'Brien')
    if (ch === "'") {
      let j = pos + 1;
      while (j < src.length) {
        if (src[j] === "\\") {
          j += 2;
          continue;
        }
        if (src[j] === "'") {
          j++;
          break;
        }
        j++;
      }
      push("string", src.slice(pos, j));
      pos = j;
      continue;
    }

    // Date / datetime literal values (2024-01-15, 2024-01-15T10:30:00Z)
    DATE_VALUE_RE.lastIndex = pos;
    const dateMatch = DATE_VALUE_RE.exec(src);
    if (dateMatch) {
      push("number", dateMatch[0]);
      pos += dateMatch[0].length;
      continue;
    }

    // Negative numeric literal (Amount > -500)
    if (ch === "-" && /\d/.test(src[pos + 1] ?? "") && inValuePosition()) {
      NUMBER_RE.lastIndex = pos + 1;
      const num = NUMBER_RE.exec(src);
      if (num) {
        push("number", `-${num[0]}`);
        pos = pos + 1 + num[0].length;
        continue;
      }
    }

    if (/\d/.test(ch)) {
      NUMBER_RE.lastIndex = pos;
      const num = NUMBER_RE.exec(src);
      if (num) {
        push("number", num[0]);
        pos += num[0].length;
        continue;
      }
    }

    // Currency literal (USD500) — uppercase ISO code directly followed by a number
    if (/[A-Z]/.test(ch) && inValuePosition()) {
      CURRENCY_RE.lastIndex = pos;
      const cur = CURRENCY_RE.exec(src);
      if (cur) {
        NUMBER_RE.lastIndex = pos + 3;
        const num = NUMBER_RE.exec(src);
        const after = pos + 3 + (num ? num[0].length : 0);
        if (num && !/[A-Za-z0-9_]/.test(src[after] ?? "")) {
          push("currency", src.slice(pos, pos + 3) + num[0]);
          pos = after;
          continue;
        }
      }
    }

    // Word / field path, possibly a `LAST_N_DAYS:365` date function
    if (/[A-Za-z_]/.test(ch)) {
      const value = readWordChain(pos);
      const next = pos + value.length;
      const upper = value.toUpperCase();
      if (N_DATE_LITERALS.has(upper) && src[next] === ":" && /\d/.test(src[next + 1] ?? "")) {
        NUMBER_RE.lastIndex = next + 1;
        const num = NUMBER_RE.exec(src);
        if (num) {
          push("dateLiteral", `${value}:${num[0]}`);
          pos = next + 1 + num[0].length;
          continue;
        }
      }
      push("word", value);
      pos = next;
      continue;
    }

    // Apex bind variable (:maxRows, :acc.Id)
    if (ch === ":" && /[A-Za-z_]/.test(src[pos + 1] ?? "")) {
      const value = readWordChain(pos + 1);
      push("bind", `:${value}`);
      pos = pos + 1 + value.length;
      continue;
    }

    if (ch === "(") {
      push("open", "(");
      pos++;
      continue;
    }
    if (ch === ")") {
      push("close", ")");
      pos++;
      continue;
    }
    if (ch === ",") {
      push("comma", ",");
      pos++;
      continue;
    }

    let matchedOperator = false;
    for (const op of ["!=", "<>", "<=", ">="]) {
      if (src.startsWith(op, pos)) {
        push("operator", op);
        pos += 2;
        matchedOperator = true;
        break;
      }
    }
    if (matchedOperator) continue;

    if (["=", "<", ">", "+", "-", "*", "/"].includes(ch)) {
      push("operator", ch);
      pos++;
      continue;
    }

    // Stray characters (statement-terminating `;`, etc.) are skipped.
    pos++;
  }

  return tokens;
}

/* ------------------------------------------------------------------ *
 * Formatter                                                           *
 * ------------------------------------------------------------------ */

type Clause =
  | "start"
  | "SELECT"
  | "FROM"
  | "WHERE"
  | "GROUPBY"
  | "HAVING"
  | "ORDERBY"
  | "LIMIT"
  | "OFFSET"
  | "WITH"
  | "WITHDATA"
  | "FOR"
  | "USING"
  | "other";

/** Saved state of the query that encloses a parenthesized subquery. */
interface QueryFrame {
  depth: number;
  clause: Clause;
  inlineParens: number;
  breakList: boolean;
}

/**
 * Formats a raw SOQL string with canonical clause capitalization, line breaks
 * before every major clause, one field per line for long SELECT lists, and
 * subqueries indented one additional level per parenthesis depth.
 */
export function formatSOQL(query: string, options: FormatSOQLOptions = {}): string {
  const indent = options.indent ?? "    ";
  const maxInlineItems = Math.max(1, options.maxInlineItems ?? 3);
  const maxLineLength = options.maxLineLength ?? 100;

  const trimmedInput = query.trim();
  if (!trimmedInput) return "";

  const hadSemicolon = /;\s*$/.test(trimmedInput);
  const tokens = tokenize(trimmedInput);
  if (tokens.length === 0) return trimmedInput;

  const lines: string[] = [];
  let cur = "";
  let depth = 0; // indent level of the current query's clause keywords
  let clause: Clause = "start";
  let inlineParens = 0; // open function-argument / grouping parens
  let breakList = false; // whether the current list clause breaks after commas
  let typeofOpen = false;
  const frames: QueryFrame[] = [];

  const newLine = (level: number): void => {
    const trimmed = cur.replace(/\s+$/, "");
    if (trimmed.length > 0) lines.push(trimmed);
    cur = indent.repeat(level);
  };

  const append = (text: string, spaced = true): void => {
    if (spaced && cur.trim().length > 0 && !cur.endsWith(" ") && !cur.endsWith("(")) {
      cur += " ";
    }
    cur += text;
  };

  const wordAt = (idx: number, ...words: string[]): boolean => {
    const t = tokens[idx];
    return !!t && t.type === "word" && words.includes(t.upper);
  };

  /** Decides whether the SELECT list starting at `selectIdx` should break. */
  const shouldBreakSelectList = (selectIdx: number): boolean => {
    let items = 1;
    let balance = 0;
    let hasSub = false;
    let hasTypeof = false;
    let len = 6; // "SELECT"
    for (let j = selectIdx + 1; j < tokens.length; j++) {
      const t = tokens[j]!;
      if (t.type === "open") {
        if (balance === 0 && wordAt(j + 1, "SELECT")) hasSub = true;
        balance++;
      } else if (t.type === "close") {
        balance--;
        if (balance < 0) break;
      } else if (t.type === "comma" && balance === 0) {
        items++;
      } else if (t.type === "word" && balance === 0) {
        if (t.upper === "FROM") break;
        if (t.upper === "TYPEOF") hasTypeof = true;
      }
      len += t.value.length + 1;
    }
    // Subqueries and TYPEOF expressions are multi-line by nature.
    if (hasSub || hasTypeof) return true;
    return items > maxInlineItems || depth * indent.length + len > maxLineLength;
  };

  /** Decides whether the GROUP BY / ORDER BY list starting at `idx` breaks. */
  const shouldBreakClauseList = (idx: number): boolean => {
    let items = 1;
    let balance = 0;
    let len = 9; // "GROUP BY" / "ORDER BY"
    for (let j = idx; j < tokens.length; j++) {
      const t = tokens[j]!;
      if (t.type === "open") {
        balance++;
      } else if (t.type === "close") {
        balance--;
        if (balance < 0) break;
      } else if (t.type === "comma" && balance === 0) {
        items++;
      } else if (t.type === "word" && balance === 0 && CLAUSE_LIST_BREAKERS.has(t.upper)) {
        break;
      }
      len += t.value.length + 1;
    }
    return items > maxInlineItems || depth * indent.length + len > maxLineLength;
  };

  let i = 0;
  while (i < tokens.length) {
    const tok = tokens[i]!;
    const next = tokens[i + 1];

    if (tok.type === "word") {
      const kw = tok.upper;
      let handled = true;

      switch (kw) {
        case "SELECT": {
          newLine(depth);
          append("SELECT");
          clause = "SELECT";
          breakList = shouldBreakSelectList(i);
          if (breakList) newLine(depth + 1);
          i++;
          break;
        }
        case "FROM": {
          newLine(depth);
          append("FROM");
          clause = "FROM";
          i++;
          break;
        }
        case "WHERE":
        case "HAVING": {
          newLine(depth);
          append(kw);
          newLine(depth + 1);
          clause = kw === "WHERE" ? "WHERE" : "HAVING";
          i++;
          break;
        }
        case "GROUP":
        case "ORDER": {
          if (wordAt(i + 1, "BY")) {
            newLine(depth);
            append(kw === "GROUP" ? "GROUP BY" : "ORDER BY");
            clause = kw === "GROUP" ? "GROUPBY" : "ORDERBY";
            i += 2;
            breakList = shouldBreakClauseList(i);
            if (breakList) newLine(depth + 1);
          } else {
            handled = false; // object name like FROM Order / FROM Group
          }
          break;
        }
        case "LIMIT": {
          newLine(depth);
          append("LIMIT");
          clause = "LIMIT";
          i++;
          break;
        }
        case "OFFSET": {
          newLine(depth);
          append("OFFSET");
          clause = "OFFSET";
          i++;
          break;
        }
        case "WITH": {
          newLine(depth);
          append("WITH");
          clause = "WITH";
          i++;
          if (wordAt(i, "SECURITY_ENFORCED", "USER_MODE", "SYSTEM_MODE")) {
            append(tokens[i]!.upper);
            i++;
          } else if (wordAt(i, "DATA")) {
            append("DATA");
            i++;
            if (wordAt(i, "CATEGORY")) {
              append("CATEGORY");
              i++;
            }
            clause = "WITHDATA"; // AND/OR inside data category filters stay inline
          }
          break;
        }
        case "FOR": {
          newLine(depth);
          append("FOR");
          clause = "FOR";
          i++;
          if (wordAt(i, "VIEW", "UPDATE", "REFERENCE")) {
            append(tokens[i]!.upper);
            i++;
          }
          break;
        }
        case "ALL": {
          if (wordAt(i + 1, "ROWS")) {
            newLine(depth);
            append("ALL ROWS");
            i += 2;
          } else {
            handled = false;
          }
          break;
        }
        case "USING": {
          newLine(depth);
          append("USING");
          clause = "USING";
          i++;
          if (wordAt(i, "SCOPE")) {
            append("SCOPE");
            i++;
          }
          break;
        }
        case "AND":
        case "OR": {
          if ((clause === "WHERE" || clause === "HAVING") && inlineParens === 0) {
            newLine(depth + 1);
          }
          append(kw);
          i++;
          break;
        }
        case "TYPEOF": {
          append("TYPEOF");
          typeofOpen = true;
          i++;
          break;
        }
        case "WHEN": {
          if (typeofOpen) {
            newLine(depth + 2);
            append("WHEN");
            i++;
          } else {
            handled = false;
          }
          break;
        }
        case "THEN": {
          if (typeofOpen) {
            append("THEN");
            i++;
          } else {
            handled = false;
          }
          break;
        }
        case "ELSE": {
          if (typeofOpen) {
            newLine(depth + 2);
            append("ELSE");
            i++;
          } else {
            handled = false;
          }
          break;
        }
        case "END": {
          if (typeofOpen) {
            newLine(depth + 1);
            append("END");
            typeofOpen = false;
            i++;
          } else {
            handled = false;
          }
          break;
        }
        default:
          handled = false;
      }

      if (!handled) {
        if (clause === "FROM") {
          append(tok.value); // object names keep their original casing
        } else if (isKeywordWord(kw) || FUNCTIONS.has(kw)) {
          append(kw);
        } else {
          append(tok.value); // fields, relationships, aliases — never mutated
        }
        i++;
      }
      continue;
    }

    switch (tok.type) {
      case "open": {
        if (next && next.type === "word" && next.upper === "SELECT") {
          // Subquery: body clauses indent two levels past the enclosing query
          // (one for the item/condition line, one for the keyword itself).
          append("(");
          frames.push({ depth, clause, inlineParens, breakList });
          depth += 2;
          clause = "start";
          inlineParens = 0;
          breakList = false;
        } else {
          const prev = tokens[i - 1];
          const glue = !!prev && (prev.type === "close" || (prev.type === "word" && !isKeywordWord(prev.upper)));
          append("(", !glue); // COUNT(Id) vs IN (...)
          inlineParens++;
        }
        i++;
        break;
      }
      case "close": {
        if (inlineParens > 0) {
          inlineParens--;
          append(")", false);
          i++;
        } else {
          const frame = frames.pop();
          if (frame) {
            newLine(frame.depth + 1);
            append(")", false);
            depth = frame.depth;
            clause = frame.clause;
            inlineParens = frame.inlineParens;
            breakList = frame.breakList;
          } else {
            append(")", false); // unbalanced input — stay tolerant
          }
          i++;
        }
        break;
      }
      case "comma": {
        append(",", false);
        if (
          inlineParens === 0 &&
          !typeofOpen &&
          breakList &&
          (clause === "SELECT" || clause === "GROUPBY" || clause === "ORDERBY")
        ) {
          newLine(depth + 1);
        }
        i++;
        break;
      }
      case "operator": {
        const prev = tokens[i - 1];
        if (tok.value === "*" && prev && prev.type === "open") {
          append("*", false); // COUNT(*)
        } else {
          append(tok.value);
        }
        i++;
        break;
      }
      case "dateLiteral":
      case "currency": {
        append(tok.upper); // LAST_N_DAYS:365 / USD500 canonical form
        i++;
        break;
      }
      case "comment": {
        newLine(depth);
        append(tok.value, false);
        const bodyLevel =
          clause === "SELECT" || clause === "WHERE" || clause === "HAVING" ||
          ((clause === "GROUPBY" || clause === "ORDERBY") && breakList)
            ? depth + 1
            : depth;
        newLine(bodyLevel);
        i++;
        break;
      }
      default: {
        append(tok.value); // string / number / bind tokens, verbatim
        i++;
        break;
      }
    }
  }

  newLine(0);
  const formatted = lines.join("\n");
  return hadSemicolon ? `${formatted};` : formatted;
}
