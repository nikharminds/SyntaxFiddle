/**
 * Regex dialect translation layer.
 *
 * Flavor-specific landing pages (MySQL, Python, PHP/PCRE, Java, .NET) accept
 * patterns written for those engines and translate them to equivalent
 * JavaScript RegExp syntax before evaluation. Constructs that translate safely
 * are rewritten with a notice; constructs whose semantics cannot be preserved
 * are rejected with a precise message — never silently mis-evaluated.
 */

export type RegexDialectId = "mysql" | "python" | "php" | "java" | "dotnet";

export type DialectTranslation =
  | { ok: true; jsPattern: string; jsFlags: string; notices: string[] }
  | { ok: false; message: string };

export interface RegexFlavorMeta {
  id: RegexDialectId;
  slug: string;
  label: string;
  languageLabel: string;
  engineNote: string;
  sample: { pattern: string; flags: string; testString: string };
}

export const REGEX_FLAVORS: RegexFlavorMeta[] = [
  {
    id: "mysql",
    slug: "mysql",
    label: "MySQL",
    languageLabel: "SQL (REGEXP / RLIKE)",
    engineNote: "ICU in MySQL 8.0+; Henry Spencer POSIX ERE in 5.x",
    sample: {
      pattern: "^[[:alpha:]]+_[[:digit:]]+$",
      flags: "g",
      testString: `user_42\norder_108\nquote_777\nbad-name\nx9\nbackup_2`,
    },
  },
  {
    id: "python",
    slug: "python",
    label: "Python",
    languageLabel: "Python 3 (re / regex)",
    engineNote: "Python re module, CPython's sre engine",
    sample: {
      pattern: "(?P<user>[\\w.]+)@(?P<domain>[\\w.]+\\.\\w+)",
      flags: "g",
      testString: `Contact: ada@example.com, grace.hopper@navy.mil\nInvalid: not-an-email\nLocal: admin@localhost`,
    },
  },
  {
    id: "php",
    slug: "php",
    label: "PHP",
    languageLabel: "PHP (PCRE — preg_*)",
    engineNote: "PCRE2, as used by preg_match and preg_replace_callback",
    sample: {
      pattern: "/#[0-9a-f]{6}\\b/i",
      flags: "g",
      testString: `body { color: #334455; background: #F0E9D8; }\naccent: #00aa88\nnot-a-color: #12345\ngradient: #ABCDEF, #a1b2c3`,
    },
  },
  {
    id: "java",
    slug: "java",
    label: "Java",
    languageLabel: "Java (java.util.regex)",
    engineNote: "java.util.regex.Pattern on the JVM",
    sample: {
      pattern: "\\p{Alpha}{2,4}-\\d{3,6}",
      flags: "g",
      testString: `SKU: abc-123\nSKU: WXYZ-998877\nbad: a1-12\nSKU: toolonglabel-1\nSKU: q-77`,
    },
  },
  {
    id: "dotnet",
    slug: "dotnet",
    label: ".NET",
    languageLabel: "C# / .NET (System.Text.RegularExpressions)",
    engineNote: "System.Text.RegularExpressions.Regex (.NET 6/7/8)",
    sample: {
      pattern: "(?<area>\\d{3})-(?<line>\\d{4})",
      flags: "g",
      testString: `Call 555-0100 or 800-8675\nExtensions: 3109, 44557\nFax 212-0001`,
    },
  },
];

const FLAVOR_BY_SLUG: Map<string, RegexFlavorMeta> = new Map(
  REGEX_FLAVORS.map((flavor) => [flavor.slug, flavor]),
);

export function getRegexFlavor(slug: string): RegexFlavorMeta | undefined {
  return FLAVOR_BY_SLUG.get(slug);
}

export function getFlavorById(id: RegexDialectId): RegexFlavorMeta {
  const flavor = REGEX_FLAVORS.find((candidate) => candidate.id === id);
  if (!flavor) throw new Error(`Unknown regex dialect: ${id}`);
  return flavor;
}

/**
 * POSIX bracket classes (MySQL pre-8 and PCRE) translated to explicit ASCII
 * equivalents — deliberately explicit rather than \d/\w/\s so the translated
 * pattern keeps the ASCII-only semantics POSIX promises.
 */
const POSIX_CLASSES: Record<string, string> = {
  alpha: "A-Za-z",
  digit: "0-9",
  alnum: "A-Za-z0-9",
  upper: "A-Z",
  lower: "a-z",
  space: " \\t\\r\\n\\v\\f",
  blank: " \\t",
  punct: "!-/:-@\\[-`{-~",
  xdigit: "0-9A-Fa-f",
  word: "A-Za-z0-9_",
  print: " -~",
  graph: "!-~",
  cntrl: "\\x00-\\x1f\\x7f",
  ascii: "\\x00-\\x7f",
};

/** java.util.regex POSIX-style \p{...} classes (ASCII form, the default). */
const JAVA_POSIX_PROPERTIES: Record<string, string> = {
  Alpha: "A-Za-z",
  Digit: "0-9",
  Alnum: "A-Za-z0-9",
  Upper: "A-Z",
  Lower: "a-z",
  Space: " \\t\\n\\x0B\\f\\r",
  Punct: "!-/:-@\\[-`{-~",
  XDigit: "0-9A-Fa-f",
  ASCII: "\\x00-\\x7f",
};

const POSIX_CLASS_PATTERN = /^\[:\^?([a-z]+):\]/;
const WHOLE_POSIX_CLASS_PATTERN = /^\[(\^?)\[:(\^?)([a-z]+):\]\]/;
const JAVA_PROPERTY_PATTERN = /^\\[pP]\{([A-Za-z]+)\}/;
const GROUP_NAME_PATTERN = /^\(\?(?:P?<(?![=!])([^>]+)>|'([^']*)')/;
const NAMED_BACKREF_PATTERN = /^\(\?P=([A-Za-z_]\w*)\)/;

const ALLOWED_JS_FLAGS = new Set(["g", "i", "m", "s", "u", "y"]);

class TranslationBlocked extends Error {}

class DialectTranslator {
  private notices: string[] = [];
  private output = "";
  private flags: Set<string>;

  constructor(
    private readonly dialect: RegexDialectId,
    private readonly pattern: string,
    flags: string,
    private readonly atStartOnly: number,
  ) {
    this.flags = new Set(
      [...flags].filter((flag) => ALLOWED_JS_FLAGS.has(flag)),
    );
  }

  run(): DialectTranslation {
    try {
      this.scan();
      const jsFlags = [...this.flags].join("");
      return {
        ok: true,
        jsPattern: this.output,
        jsFlags,
        notices: this.notices,
      };
    } catch (error) {
      if (error instanceof TranslationBlocked) {
        return { ok: false, message: error.message };
      }
      return { ok: false, message: "The pattern could not be translated." };
    }
  }

  private note(message: string): void {
    if (!this.notices.includes(message)) this.notices.push(message);
  }

  private block(message: string): never {
    throw new TranslationBlocked(message);
  }

  private get supportsPosixClasses(): boolean {
    return this.dialect === "mysql" || this.dialect === "php";
  }

  private scan(): void {
    let i = 0;
    let inClass = false;

    while (i < this.pattern.length) {
      const char = this.pattern[i]!;

      if (char === "\\") {
        const written = this.translateEscape(i, inClass);
        i += written;
        continue;
      }

      if (char === "[" && !inClass) {
        // A class consisting of exactly one POSIX class — [[:alpha:]] or
        // [^[:alpha:]] — is replaced wholesale including the outer brackets.
        const whole = WHOLE_POSIX_CLASS_PATTERN.exec(this.pattern.slice(i));
        if (whole) {
          const negated = whole[1] === "^" || whole[2] === "^";
          const expansion = this.resolvePosixExpansion(whole[3]!, negated);
          this.output += negated ? `[^${expansion}]` : `[${expansion}]`;
          this.notePosixExpansion(whole[3]!, negated);
          i += whole[0].length;
          continue;
        }
        inClass = true;
        this.output += char;
        i += 1;
        // A ']' immediately after '[' or '[^' is a literal member.
        if (this.pattern[i] === "^") {
          this.output += "^";
          i += 1;
        }
        if (this.pattern[i] === "]") {
          this.output += "\\]";
          i += 1;
        }
        continue;
      }

      if (char === "]" && inClass) {
        inClass = false;
        this.output += char;
        i += 1;
        continue;
      }

      if (inClass) {
        if (char === "[" && this.pattern[i + 1] === ":") {
          i += this.translatePosixClass(i);
          continue;
        }
        this.output += char;
        i += 1;
        continue;
      }

      if (char === "(") {
        const written = this.translateGroup(i);
        i += written;
        continue;
      }

      if (
        (char === "*" || char === "+" || char === "?") &&
        this.pattern[i + 1] === "+"
      ) {
        this.block(
          `Possessive quantifier "${char}+" is not supported by JavaScript's RegExp engine (only the experimental v flag adds atomic behavior). Rewrite as an atomic construct for your flavor or drop the possessive + and rely on the ReDoS guard here.`,
        );
      }

      if (char === "}" && this.pattern[i + 1] === "+") {
        // Only treat `}+` as possessive when the braces form a real quantifier
        // — literal braces (as in \p{L}+) must pass through untouched.
        const braceContent = /\{([^{}]*)\}$/.exec(this.pattern.slice(0, i));
        if (braceContent && /^\d+(,\d*)?$/.test(braceContent[1]!)) {
          this.block(
            'Possessive interval quantifier "{...}+" is not supported by JavaScript\'s RegExp engine. Remove the trailing + or restructure the pattern.',
          );
        }
      }

      this.output += char;
      i += 1;
    }
  }

  private static escapeLiteral(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private translateEscape(index: number, inClass: boolean): number {
    const next = this.pattern[index + 1];

    if (next === undefined) {
      this.output += "\\";
      return 1;
    }

    if (next === "Q" && !inClass) {
      // \Q ... \E literal quoting (PCRE and Java).
      if (this.dialect === "php" || this.dialect === "java") {
        const end = this.pattern.indexOf("\\E", index + 2);
        const literal =
          end === -1
            ? this.pattern.slice(index + 2)
            : this.pattern.slice(index + 2, end);
        this.output += DialectTranslator.escapeLiteral(literal);
        this.note(
          "\\Q...\\E literal quoting was expanded to an explicitly escaped literal — JavaScript has no quoting construct.",
        );
        return end === -1 ? this.pattern.length - index : end + 2 - index;
      }
      this.block(
        `\\Q...\\E literal quoting does not exist in ${getFlavorById(this.dialect).label} regex — it is a PCRE/Java construct.`,
      );
    }

    if (next === "E") {
      return 2;
    }

    if (inClass) {
      this.output += `\\${next}`;
      return 2;
    }

    switch (next) {
      case "A":
        this.output += "^";
        this.note(
          "\\A (absolute string start) became ^ — keep the m flag off or the anchor moves to every line start.",
        );
        return 2;
      case "z":
        this.output += "$";
        this.note(
          "\\z (absolute string end) became $ — with the m flag off, JavaScript's $ also matches before one trailing newline, a subtle difference from true \\z.",
        );
        return 2;
      case "Z":
        this.output += "$";
        this.note(
          "\\Z (end, before a final newline) matches JavaScript's $ with the m flag off.",
        );
        return 2;
      case "h":
      case "H": {
        if (this.dialect !== "php") break;
        this.output += next === "h" ? "[ \\t]" : "[^ \\t]";
        this.note(`\\${next} (horizontal whitespace) became ${next === "h" ? "[ \\t]" : "[^ \\t]"}.`);
        return 2;
      }
      case "v":
      case "V": {
        if (this.dialect !== "php") break;
        this.output +=
          next === "v" ? "[\\n\\x0B\\f\\r\\u2028\\u2029]" : "[^\\n\\x0B\\f\\r\\u2028\\u2029]";
        this.note(`\\${next} (vertical whitespace) was expanded to an explicit class.`);
        return 2;
      }
      case "R": {
        if (this.dialect !== "php") break;
        this.output += "(?:\\r\\n|[\\n\\x0B\\f\\r\\u2028\\u2029])";
        this.note("\\R (any line break sequence) became (?:\\r\\n|[...]) preserving CRLF grouping.");
        return 2;
      }
      case "K": {
        if (this.dialect === "php") {
          this.block(
            "\\K (reset match start) has no JavaScript equivalent — the reported match would start at a different offset than PCRE reports.",
          );
        }
        break;
      }
      case "G": {
        this.block(
          "\\G (end of previous match anchor) has no JavaScript equivalent. The y (sticky) flag approximates positional matching but changes semantics; test the pattern without \\G instead.",
        );
      }
      case "b": {
        if (this.dialect === "mysql") {
          this.note(
            "\\b is a word boundary in MySQL 8+ (ICU) but a backspace in MySQL 5.x (Spencer). It is treated as a word boundary here.",
          );
        }
        break;
      }
      case "p":
      case "P": {
        const propertyMatch = JAVA_PROPERTY_PATTERN.exec(this.pattern.slice(index));
        if (propertyMatch && this.dialect === "java") {
          const name = propertyMatch[1]!;
          const expansion = JAVA_POSIX_PROPERTIES[name];
          if (next === "p" && expansion) {
            this.output += `[${expansion}]`;
            this.note(
              `\\p{${name}} (Java ASCII POSIX property) became [${expansion}]. Java's UNICODE_CHARACTER_CLASS variant has broader reach than this ASCII expansion.`,
            );
            return propertyMatch[0].length;
          }
          if (next === "P" && expansion) {
            this.block(
              `Negated \\P{${name}} cannot be expressed as a plain class here — translate it manually as a negated character class [^${expansion}] around a single character.`,
            );
          }
          if (!expansion && name.startsWith("Is")) {
            this.block(
              `Unicode block property \\${next}{${name}} (Java) has no reliable JavaScript equivalent — JS supports general categories and script names via \\p{...} with the u flag, not Java's Is-prefixed blocks.`,
            );
          }
          // General-category or script property (\p{L}, \p{IsAlphabetic}):
          // consume the full token so the braces are not scanned as literals.
          this.flags.add("u");
          this.note(
            "Unicode property escapes require the u flag in JavaScript — it was added automatically. Verify the property name is one JavaScript supports (categories like \\p{L}, scripts like \\p{Greek}).",
          );
          this.output += propertyMatch[0];
          return propertyMatch[0].length;
        }
        if (this.dialect === "dotnet" && propertyMatch && propertyMatch[1]!.startsWith("Is")) {
          this.block(
            `.NET Unicode block \\${next}{${propertyMatch[1]}} has no exact JavaScript equivalent; JavaScript exposes scripts and categories (\\p{Script=Latin}, \\p{L}) with the u flag instead.`,
          );
        }
        this.flags.add("u");
        this.note(
          "Unicode property escapes require the u flag in JavaScript — it was added automatically. Verify the property name is one JavaScript supports (categories like \\p{L}, scripts like \\p{Greek}).",
        );
        break;
      }
      case "d":
      case "D":
      case "w":
      case "W":
      case "s":
      case "S": {
        if (this.dialect === "mysql") {
          this.note(
            `\\${next} requires MySQL 8.0+ (ICU). In MySQL 5.x only POSIX classes like [[:digit:]] exist.`,
          );
        } else if (this.dialect === "python" || this.dialect === "dotnet") {
          this.note(
            `In ${getFlavorById(this.dialect).label}, \\${next} matches Unicode by default. JavaScript matches ASCII only unless the u flag is on — enable it for full parity.`,
          );
        }
        break;
      }
      default: {
        if (/[a-zA-Z]/.test(next)) {
          this.note(
            `\\${next} is not a standard ${getFlavorById(this.dialect).label} escape — JavaScript treats unknown letter escapes as the literal character "${next}". Verify that is intended.`,
          );
        }
        break;
      }
    }

    this.output += `\\${next}`;
    return 2;
  }

  private resolvePosixExpansion(name: string, _negated: boolean): string {
    const expansion = POSIX_CLASSES[name];
    if (!expansion) {
      this.block(`POSIX class [:${name}:] is not a recognized POSIX class name.`);
    }
    if (!this.supportsPosixClasses) {
      this.block(
        `POSIX classes like [:${name}:] are a MySQL/PCRE construct — ${getFlavorById(this.dialect).label} regex does not support them.`,
      );
    }
    return expansion;
  }

  private notePosixExpansion(name: string, negated: boolean): void {
    this.note(
      `[${negated ? ":^" : ":"}${name}:] was expanded to ${negated ? "a negated class" : "an explicit class"} covering exactly its ASCII members.`,
    );
  }

  private translatePosixClass(index: number): number {
    const remainder = this.pattern.slice(index);
    const match = POSIX_CLASS_PATTERN.exec(remainder);
    if (!match) {
      // Not actually a POSIX class — copy the bracket and continue normally.
      this.output += "[";
      return 1;
    }
    const name = match[1]!;
    const negated = remainder.startsWith("[:^");
    const expansion = this.resolvePosixExpansion(name, negated);
    if (negated) {
      this.block(
        `A negated POSIX class [:^${name}:] inside a larger character class cannot be merged — rewrite it as its own [^...] class outside the enclosing brackets.`,
      );
    }
    // Splice the members into the enclosing class; the outer brackets wrap.
    this.output += expansion;
    this.notePosixExpansion(name, false);
    return match[0].length;
  }

  private translateGroup(index: number): number {
    const remainder = this.pattern.slice(index);

    // (?P=name) named backreference — Python.
    const backrefMatch = NAMED_BACKREF_PATTERN.exec(remainder);
    if (backrefMatch) {
      if (this.dialect === "python" || this.dialect === "php") {
        this.output += `\\k<${backrefMatch[1]}>`;
        this.note(`(?P=${backrefMatch[1]}) became \\k<${backrefMatch[1]}> — JavaScript's named backreference syntax.`);
        return backrefMatch[0].length;
      }
      this.block(
        `(?P=...) named backreferences are Python/PCRE syntax; ${getFlavorById(this.dialect).label} does not support them.`,
      );
    }

    // Named groups: (?P<name>…), (?<name>…), (?'name'…) → (?<name>…)
    const nameMatch = GROUP_NAME_PATTERN.exec(remainder);
    if (nameMatch) {
      const name = (nameMatch[1] ?? nameMatch[2] ?? "").trim();
      if (name.includes("-")) {
        this.block(
          `(?<${name}>) looks like a .NET balancing group definition — balancing groups have no JavaScript equivalent.`,
        );
      }
      if (name.length === 0) {
        this.block("A named group requires a non-empty name.");
      }
      if (!/^[A-Za-z_]\w*$/.test(name) && !name.startsWith("_")) {
        // JS named groups accept a wider set of identifiers (any ID继续 chars),
        // but flag exotic names to be safe.
        this.note(
          `Group name "${name}" is valid in ${getFlavorById(this.dialect).label}; JavaScript requires valid identifier characters in group names.`,
        );
      }
      this.output += `(?<${name}>`;
      this.note(
        nameMatch[2] !== undefined
          ? `(?'${name}'…) became (?<${name}>…) — JavaScript's named-group syntax.`
          : nameMatch[1] !== undefined && remainder.startsWith("(?P<")
            ? `(?P<${name}>…) became (?<${name}>…) — JavaScript's named-group syntax.`
            : `(?<${name}>…) passes through unchanged — JavaScript supports this exact syntax.`,
      );
      return nameMatch[0].length;
    }

    if (remainder.startsWith("(?>")) {
      this.block(
        "Atomic groups (?>...) prevent backtracking into the group; JavaScript's engine has no equivalent (short of the experimental v flag) and silently accepting them would change match results.",
      );
    }
    if (remainder.startsWith("(?P>")) {
      this.block("(?P>...) is Python's atomic-group spelling and is not supported by JavaScript.");
    }
    const isPhpCallout = remainder.startsWith("(?C") && this.dialect === "php";
    if (
      remainder.startsWith("(?R") ||
      remainder.startsWith("(?&") ||
      isPhpCallout ||
      /^(?:\(\?\d|\(\?-?\d)/.test(remainder)
    ) {
      this.block(
        "Recursion, subroutine calls, and callouts — (?R), (?1), (?&name), (?C) — have no JavaScript equivalent.",
      );
    }
    if (remainder.startsWith("(?(")) {
      this.block(
        "Conditional patterns (?(condition)yes|no) are not supported by JavaScript's RegExp engine.",
      );
    }
    if (remainder.startsWith("(?#")) {
      const end = remainder.indexOf(")");
      if (end === -1) this.block("Unterminated comment group (?#...");
      this.note("(?#...) comment group was stripped — JavaScript has no comment groups.");
      return end + 1;
    }

    // Inline flag groups: (?flags) or (?flags:...)
    const inlineMatch = /^\(\?([a-zA-Z-]+)([:)])?/.exec(remainder);
    if (inlineMatch) {
      const letters = inlineMatch[1]!;
      const terminator = inlineMatch[2];
      const hasMinus = letters.includes("-");
      const scoped = terminator === ":";

      if (hasMinus) {
        this.block(
          `Negative or mixed inline flags (${letters}) cannot be expressed in JavaScript — flags apply to the whole pattern or not at all.`,
        );
      }
      if (scoped) {
        this.block(
          `Scoped inline flags (?${letters}:...) apply to part of the pattern only; JavaScript cannot scope flags. Move the flag to the whole pattern or split the pattern.`,
        );
      }
      if (index !== this.atStartOnly) {
        this.block(
          `Inline flags (?${letters}) are only valid at the very start of the pattern in JavaScript. ${getFlavorById(this.dialect).label} allows them anywhere.`,
        );
      }

      for (const letter of letters) {
        if (letter === "i" || letter === "m" || letter === "s") {
          this.flags.add(letter);
          this.note(`Inline flag ${letter} was promoted to the pattern's ${letter} flag.`);
        } else if (letter === "u") {
          this.flags.add("u");
          this.note("PCRE's UTF mode has no exact JS twin; the u flag was added as the closest equivalent.");
        } else if (letter === "a") {
          this.note(
            "Python's ASCII-only flag (?a) roughly matches JavaScript's default ASCII \\w/\\d behavior — nothing to change here.",
          );
        } else if (letter === "x") {
          this.block(
            "Verbose mode (?x) — ignoring whitespace and # comments — cannot be translated safely. Write the pattern without whitespace or translate it manually.",
          );
        } else if (letter === "g") {
          this.block("Java's (?g) line-oriented matching mode has no JavaScript equivalent.");
        } else if (letter === "n") {
          this.block(".NET's explicit-capture mode (?n) changes every group's capture semantics and cannot be translated.");
        } else if (letter === "d" && this.dialect === "java") {
          this.note("Java's duplicate-names flag (?d) was dropped — JavaScript allows duplicate group names in alternatives natively.");
        } else if (letter === "L" && this.dialect === "python") {
          this.note("Python's locale flag (?L) has no JavaScript equivalent; matching stays Unicode-aware.");
        } else {
          this.block(`Inline flag ?${letter} is not supported by JavaScript's RegExp engine.`);
        }
      }
      return inlineMatch[0].length;
    }

    this.output += "(";
    return 1;
  }
}

/** PHP patterns are conventionally written /pattern/modifiers — extract them. */
function stripPhpDelimiters(pattern: string): {
  pattern: string;
  modifiers: string[];
} {
  const match = /^([/#~%+=])(.*)\1([a-zA-Z]*)$/s.exec(pattern);
  if (!match) return { pattern, modifiers: [] };
  return { pattern: match[2]!, modifiers: [...match[3] ?? ""] };
}

export function translateDialectPattern(
  dialect: RegexDialectId,
  rawPattern: string,
  flags: string,
): DialectTranslation {
  let pattern = rawPattern;
  let extraFlags = "";

  if (dialect === "php") {
    const stripped = stripPhpDelimiters(pattern);
    if (stripped.pattern !== pattern) {
      pattern = stripped.pattern;
      for (const modifier of stripped.modifiers) {
        if (modifier === "i" || modifier === "m" || modifier === "s" || modifier === "u") {
          if (!extraFlags.includes(modifier)) extraFlags += modifier;
        }
      }
      const ignored = stripped.modifiers.filter(
        (modifier) => !"imsu".includes(modifier),
      );
      if (ignored.length > 0) {
        return {
          ok: false,
          message: `PCRE modifier${ignored.length === 1 ? "" : "s"} "${ignored.join("")}" cannot be translated to JavaScript. Supported trailing modifiers: i, m, s, u.`,
        };
      }
    }
  }

  const translator = new DialectTranslator(
    dialect,
    pattern,
    flags + extraFlags,
    0,
  );
  const result = translator.run();

  if (result.ok && dialect === "mysql" && !result.jsFlags.includes("i")) {
    result.jsFlags += "i";
    result.notices.push(
      "MySQL REGEXP is case-insensitive under default collations — the i flag was added automatically. In MySQL 8 you can flip to case-sensitive with REGEXP_LIKE(..., 'c').",
    );
  }

  return result;
}

/** Stable identity transform used by the default (JavaScript) tester. */
export function identityTransform(pattern: string, flags: string): DialectTranslation {
  return { ok: true, jsPattern: pattern, jsFlags: flags, notices: [] };
}
