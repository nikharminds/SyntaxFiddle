import type { RegexDialectId } from "./dialects";

/**
 * SEO content for the regex flavor landing pages (MySQL, Python, PHP/PCRE,
 * Java, .NET). Each flavor documents its engine's real semantics, the
 * constructs that translate to JavaScript, and the constructs that do not —
 * the tester itself never pretends to be the flavor's engine.
 */

export type RegexFlavorIcon = "lock" | "zap" | "terminal" | "shield" | "code";

export interface RegexFlavorCheatRow {
  token: string;
  meaning: string;
  example: string;
}

export interface RegexFlavorDifference {
  construct: string;
  flavor: string;
  javascript: string;
}

export interface RegexFlavorContent {
  id: RegexDialectId;
  slug: string;
  title: string;
  heading: string;
  description: string;
  heroDescription: string;
  keywords: string[];
  featureList: string[];
  facts: { icon: RegexFlavorIcon; title: string; description: string }[];
  sections: { heading: string; body: string[] }[];
  cheatSheet: RegexFlavorCheatRow[];
  differences: RegexFlavorDifference[];
  faqs: { question: string; answer: string }[];
}

const PRIVACY_FACT = {
  icon: "lock" as const,
  title: "Zero upload, ever",
  description:
    "Patterns and test data are evaluated in your browser — connection strings and column values never touch a server.",
};

const SPEED_FACT = {
  icon: "zap" as const,
  title: "Live translation",
  description:
    "The dialect translator and the match engine recompute on every keystroke, with notices explaining each rewrite.",
};

const HONESTY_FACT = {
  icon: "shield" as const,
  title: "Honest where it matters",
  description:
    "Constructs that cannot be translated faithfully are rejected with a precise reason — never silently mis-matched.",
};

export const REGEX_FLAVOR_CONTENT: RegexFlavorContent[] = [
  {
    id: "mysql",
    slug: "mysql",
    title: "MySQL Regex Tester — Test REGEXP_LIKE Patterns Online | SyntaxFiddle",
    heading: "MySQL Regex Tester — REGEXP, RLIKE & REGEXP_LIKE Patterns",
    description:
      "Test MySQL REGEXP and RLIKE patterns online: POSIX classes like [[:digit:]] are translated and evaluated live, with the MySQL 5.x versus 8.0 differences flagged before you ship. 100% client-side — your data never uploads.",
    heroDescription:
      "Write the pattern the way you would inside REGEXP_LIKE() — POSIX classes, case-insensitive collation semantics, and MySQL 8 ICU escapes are translated to the evaluation engine live, with a notice explaining every rewrite and a clear rejection when a construct would silently mis-match. Nothing you paste is uploaded.",
    keywords: [
      "mysql regex tester",
      "mysql regexp tester",
      "mysql regular expression tester",
      "regexp_like tester",
      "mysql rlike tester",
      "regexp_substr tester",
      "mysql regex online",
      "sql regex tester",
      "mysql regexp online",
      "posix regex tester",
    ],
    featureList: [
      "POSIX bracket classes — [[:alpha:]], [[:digit:]], [[:alnum:]], [[:space:]] — expanded to exact ASCII equivalents",
      "Case-insensitive collation semantics applied automatically, the way REGEXP behaves by default",
      "MySQL 5.x (Spencer) versus 8.0+ (ICU) differences flagged per construct, never silently ignored",
      "REDoS-guarded evaluation in a sandboxed Web Worker with a 2-second budget",
      "100% client-side — table data and patterns never leave the browser",
    ],
    facts: [
      PRIVACY_FACT,
      SPEED_FACT,
      {
        icon: "code" as const,
        title: "Version-aware notices",
        description:
          "\\d, \\w, lookaheads and \\b each carry a MySQL 5.x versus 8.0 caveat so you know what ships.",
      },
    ],
    sections: [
      {
        heading: "MySQL has two regex engines — and the version changes everything",
        body: [
          "Every MySQL regex question starts with the same fork: MySQL 8.0.0 and later use the International Components for Unicode (ICU) library, while MySQL 5.6 and 5.7 use the Henry Spencer library, a classic POSIX Extended Regular Expression implementation. The practical differences are not cosmetic. POSIX ERE has no \\d, \\w, or \\s shorthand — only bracket classes like [[:digit:]] — no lazy quantifiers, and (until ICU arrived) no lookahead at all. A pattern written for one engine can be syntactically invalid or semantically different on the other, which is why this tester attaches a version notice to every construct whose behavior differs: \\d earns a 'requires MySQL 8.0+' notice, and \\b carries the backspace-versus-word-boundary warning because Spencer and ICU disagree about it.",
          "Case sensitivity is the other version-spanning trap. MySQL string comparison follows the column's collation, and under a default *_ci collation REGEXP matches case-insensitively — unlike nearly every other language's regex engine. The tester applies the i flag automatically to mirror that default, and tells you it did. To opt into case sensitivity in MySQL 8, use REGEXP_LIKE(col, pattern, 'c'); in 5.x the honest answer is that REGEXP inherits the collation, so a _cs collation or UPPER() on both sides is the workaround.",
        ],
      },
      {
        heading: "POSIX classes are the portable subset — use them deliberately",
        body: [
          "The bracket classes — [[:alpha:]], [[:digit:]], [[:alnum:]], [[:upper:]], [[:lower:]], [[:space:]], [[:punct:]], [[:xdigit:]], [[:word:]] — work identically in 5.x and 8.0 and in every POSIX-flavored engine, which makes them the safest vocabulary for SQL you intend to keep. The tester expands each one to an explicit ASCII class covering exactly its POSIX members: [[:space:]] becomes the literal set of six whitespace characters POSIX defines, deliberately not JavaScript's broader \\s, because silently widening a class is how a WHERE clause starts matching rows it should not. Negated classes like [[:^digit:]] translate too, as long as the POSIX class is the sole member of its brackets.",
          "The generated WHERE-ready patterns you validate here transfer one-to-one to REGEXP, RLIKE, REGEXP_LIKE, REGEXP_SUBSTR, and REGEXP_REPLACE. The 8.0 function family matters more than people expect: REGEXP_SUBSTR(col, pattern) finally answers 'what matched' rather than just whether anything matched, REGEXP_REPLACE does what five versions of nested SUBSTRING_INDEX hacks used to, and REGEXP_INSTR returns match positions. In 5.x you get the boolean REGEXP/RLIKE and string functions only — a constraint worth knowing before you write the query.",
        ],
      },
      {
        heading: "SQL string literals escape your backslashes twice",
        body: [
          "The tester evaluates the raw pattern, but MySQL evaluates a pattern embedded in a SQL string literal — and by default MySQL treats backslash as an escape character inside string literals too. Writing REGEXP_LIKE(name, '\\d+') sends the engine just d+ because the literal layer consumes one backslash; the pattern must be written '\\\\d+' (four backslashes in some client contexts) so the engine receives \\d. This double-escaping is the single most common reason a pattern that works in a tester fails in production SQL, and every notice this tool shows refers to the engine-level pattern — the one after the string literal has done its work.",
          "Two situational footnotes complete the picture. First, sql_mode=NO_BACKSLASH_ESCAPES disables that literal-layer escaping, so the same SQL text behaves differently on servers with different sql_mode settings. Second, patterns pasted straight from browser DevTools or shell scripts often arrive with a quoting history of their own — strip that layer in your head before pasting here, and let the tester reason about engine-level syntax only.",
        ],
      },
      {
        heading: "Performance: REGEXP scans, LIKE can sometimes seek",
        body: [
          "A regex predicate forces a full scan of every row in scope — there is no B-tree index that can satisfy REGEXP or RLIKE the way a left-anchored LIKE 'abc%' sometimes can. On a large table that is the difference between milliseconds and minutes, so the standard playbook is: narrow the candidate set with an indexed, sargable predicate first (a LEFT(name, 4) = 'INV-' or a generated column), then apply the regex to the small remainder. Testing the pattern here first is the cheap half of that workflow — the tester's match table shows you exactly which rows a pattern selects before a scan ever runs.",
          "The 2-second execution budget in this tester doubles as a rehearsal for server-side behavior: catastrophic shapes like (a+)+ or (a|a)+ pinned against a non-matching string explode combinatorially in ICU just as they do in every backtracking engine, and on the database that is a query that never returns while it burns CPU. If the tester rejects your pattern for exceeding the budget, the pattern does not belong in a WHERE clause either — restructure it with possessive-free, bounded repetition before it reaches production.",
        ],
      },
    ],
    cheatSheet: [
      { token: "[[:alpha:]]", meaning: "Any ASCII letter", example: "[[:alpha:]]+ → matches Acme" },
      { token: "[[:digit:]]", meaning: "Any digit 0–9 (portable form of \\d)", example: "[[:digit:]]{3} → matches 123" },
      { token: "[[:alnum:]]", meaning: "Letter or digit", example: "[[:alnum:]]_ → matches a_" },
      { token: "[[:space:]]", meaning: "Space, tab, newline, CR, VT, FF", example: "a[[:space:]]b → matches a b" },
      { token: "[[:upper:]]", meaning: "Uppercase letter (collation may ignore case)", example: "[[:upper:]]{2} → matches NY" },
      { token: "[[:punct:]]", meaning: "ASCII punctuation", example: "[[:punct:]]$ → trailing !" },
      { token: "[[:xdigit:]]", meaning: "Hex digit", example: "0x[[:xdigit:]]+ → 0xFF" },
      { token: "[[:^digit:]]", meaning: "Anything but a digit", example: "[[:^digit:]] → matches a" },
      { token: "^ ... $", meaning: "Anchors — field start and end", example: "^INV-[[:digit:]]+$" },
      { token: "{2,4}", meaning: "Between 2 and 4 repetitions", example: "[[:digit:]]{2,4} → 123" },
      { token: "(...|...)", meaning: "Alternation group", example: "(cat|dog) → either word" },
      { token: "\\\\", meaning: "Literal backslash in the pattern (doubled per SQL literal rules)", example: "a\\\\b → matches a\\b" },
    ],
    differences: [
      {
        construct: "Shorthand classes",
        flavor: "POSIX [[:digit:]] everywhere; \\d, \\w, \\s only in 8.0+ (ICU)",
        javascript: "\\d, \\w, \\s supported in every modern engine",
      },
      {
        construct: "Case sensitivity",
        flavor: "Follows collation — case-insensitive by default (*_ci)",
        javascript: "Case-sensitive unless the i flag is set (auto-added here)",
      },
      {
        construct: "\\b",
        flavor: "Backspace in 5.x (Spencer); word boundary in 8.0+ (ICU)",
        javascript: "Always a word boundary",
      },
      {
        construct: "Lookahead (?=…)",
        flavor: "Not supported before 8.0.22-ish ICU versions",
        javascript: "Supported since forever; lookahead and lookbehind both work",
      },
      {
        construct: "Backreferences \\1",
        flavor: "Supported (both engines)",
        javascript: "Supported",
      },
      {
        construct: "Pattern transport",
        flavor: "Pattern sits inside a SQL string literal — backslashes escape twice",
        javascript: "Pattern is plain source text — no literal layer",
      },
      {
        construct: "Matching model",
        flavor: "REGEXP returns true/false per row; REGEXP_SUBSTR returns the match",
        javascript: "Boolean test, global match list, or replace — engine methods differ",
      },
      {
        construct: "Unicode",
        flavor: "Byte-oriented in practice; ICU in 8.0 handles UTF-8 with care",
        javascript: "Code-unit oriented; u flag switches to code points",
      },
    ],
    faqs: [
      {
        question: "Which MySQL version supports \\d, \\w, and \\s in regex?",
        answer:
          "MySQL 8.0 and later, because the regex engine switched to ICU, which understands Perl-style shorthand. In MySQL 5.6 and 5.7 the Spencer library only accepts POSIX classes — write [[:digit:]] instead of \\d or the query fails with an illegal operand error. The tester accepts both and attaches a version notice whenever you use the 8.0-only forms.",
      },
      {
        question: "Why does my pattern work here but fail in the MySQL client?",
        answer:
          "Almost always double escaping. Inside a SQL string literal, MySQL consumes one backslash layer before the regex engine sees the pattern, so '\\d+' arrives as 'd+'. Write '\\\\d+' in the SQL literal so the engine receives \\d — or set sql_mode=NO_BACKSLASH_ESCAPES to disable the literal layer. The tester always evaluates the engine-level pattern, which is the form that must survive the escaping.",
      },
      {
        question: "How do I make REGEXP case-sensitive in MySQL?",
        answer:
          "In MySQL 8, pass the match-type argument: REGEXP_LIKE(column, 'pattern', 'c') forces case-sensitive matching regardless of collation. In MySQL 5.x, REGEXP inherits the collation, so you need a case-sensitive or binary collation on the expression (for example CONVERT(col USING binary)) or compare UPPER() on both sides. The tester adds the i flag automatically to mirror the default *_ci behavior and says so in the notices.",
      },
      {
        question: "What is the difference between REGEXP, RLIKE, and REGEXP_LIKE?",
        answer:
          "REGEXP and RLIKE are synonyms — both are boolean predicates usable in WHERE and return 1, 0, or NULL. REGEXP_LIKE() is the MySQL 8.0 function-family form with the same boolean result plus an optional match-type argument for case and multiline behavior. The 8.0 family adds REGEXP_SUBSTR (returns the matched text), REGEXP_INSTR (returns the position), and REGEXP_REPLACE — none of which exist in 5.x.",
      },
      {
        question: "Can REGEXP use an index?",
        answer:
          "No. A regex predicate is evaluated row by row and forces a full scan of the rows in scope; B-tree indexes only help left-anchored LIKE patterns. The standard pattern is to pre-filter with a sargable predicate — an indexed prefix match or a generated column — and apply REGEXP to the narrowed set. Validating the pattern here first keeps the scan you do run as cheap as it can be.",
      },
      {
        question: "Does MySQL regex match against numbers and dates?",
        answer:
          "REGEXP implicitly casts non-string operands to strings before matching, so a DECIMAL price or a DATE becomes its text representation first. That means locale and formatting affect what the pattern sees — a DATE renders as '2026-01-15', not as a timestamp. Match against explicit CAST or DATE_FORMAT output when the text shape matters, and test the exact rendered form here before shipping the query.",
      },
    ],
  },
  {
    id: "python",
    slug: "python",
    title: "Python Regex Tester — Test re Module Patterns Online | SyntaxFiddle",
    heading: "Python Regex Tester — re Module Patterns, Translated Live",
    description:
      "Test Python re patterns online: (?P<name>) groups, \\A \\Z anchors, and inline flags are translated to the evaluation engine live with per-construct notices. Runs client-side — nothing is uploaded.",
    heroDescription:
      "Write the pattern the way it appears in re.compile() — named groups as (?P<year>...), backreferences as (?P=year), anchors as \\A and \\Z — and the translator rewrites each construct to its JavaScript equivalent in real time, telling you exactly what changed and stopping with a precise message when a construct (verbose mode, atomic groups) has no faithful translation.",
    keywords: [
      "python regex tester",
      "python regexp tester",
      "python regular expression tester online",
      "re module tester",
      "python re tester",
      "python named groups tester",
      "python regex online",
      "pythex alternative",
      "python regex debugger",
      "python pattern matcher",
    ],
    featureList: [
      "(?P<name>...) named groups rewritten to JavaScript's (?<name>...) syntax with a notice",
      "(?P=name) backreferences translated to \\k<name>",
      "\\A / \\Z anchors mapped to ^ / $ with the trailing-newline caveat spelled out",
      "Leading inline flags — (?i), (?m), (?s), (?a) — promoted to pattern flags",
      "Verbose (?x) patterns, atomic groups, and conditionals rejected with precise reasons instead of mis-matching",
    ],
    facts: [
      PRIVACY_FACT,
      SPEED_FACT,
      HONESTY_FACT,
    ],
    sections: [
      {
        heading: "The re module's dialect, translated construct by construct",
        body: [
          "Python's re module grew its named-group syntax years before JavaScript standardized one, so the two languages spell the same idea differently: Python writes (?P<name>...) and references the group later as (?P=name), while JavaScript (and PCRE) write (?<name>...) and \\k<name>. The translator rewrites both forms on the fly and shows the rewritten pattern, so what you see in the match table uses your names — the group panel reports year, month, user, or whatever you named them, exactly as m.group('year') would in Python. Numbered backreferences \\1 through \\99 pass through untouched; both engines agree on them.",
          "The anchors are where semantics, not just spelling, differ. Python's \\A and \\Z are absolute — they mean the true start and end of the string, unaffected by any flag. JavaScript's ^ and $ match at line boundaries when the m flag is on, and JavaScript's $ has one extra quirk: without m it also matches just before a single trailing newline, which Python's \\Z never does. The translator maps \\A to ^ and \\Z to $ and attaches a notice reminding you to keep m off — and if you are validating input where a trailing newline must not match (password rules, API tokens), test with the newline actually present.",
        ],
      },
      {
        heading: "Unicode by default — the biggest invisible difference",
        body: [
          "In Python 3, patterns compiled from str are Unicode by default: \\w matches word characters from every script, \\d matches non-ASCII digits, and \\s includes Unicode whitespace. JavaScript is the opposite — without the u flag its shorthand classes are ASCII-only, and \\d rejects the Arabic-Indic digits Python happily matches. The tester flags every \\d, \\w, and \\s with a notice recommending the u flag for full parity, because on internationalized data the difference is real rows matched versus missed. Python's (?a) ASCII-only mode matches JavaScript's default behavior, so patterns written with (?a) translate with no extra care needed.",
          "The dot deserves its own sentence: Python's . matches any character except newline, and re.DOTALL lifts that — the same shape as JavaScript's s (dotAll) flag, which the flag bar exposes directly. Python's re.MULTILINE maps to JavaScript's m flag one-to-one; both re-anchor ^ and $ at line boundaries. The one flag with no translation is re.VERBOSE — see the FAQ — because ignoring whitespace and # comments cannot be faked safely by a translator and would silently change what matches.",
        ],
      },
      {
        heading: "From tester to code: the API mapping",
        body: [
          "The tester's global mode is re.findall() and re.finditer(); its single-match mode is re.search(). The mapping continues usefully into code you write afterward: match.group('name') in Python becomes match.groups.name here and match.groups.name in JavaScript's result objects; groupdict() becomes the named-group panel; re.sub(r'(?P<h>\\d+)', r'\\g<h>', s) becomes s.replace(regex, '$<h>') with the same named-reference idea in the replacement string. If you validate a pattern here with named groups, the names carry all the way into your production code — that is deliberate.",
          "Two API-level behaviors worth rehearsing before you trust a pattern. re.match() anchors at the start of the string (an implicit \\A) while re.search() scans — JavaScript's .test() and exec() are search-shaped, so add ^ yourself when you mean match(). And re.fullmatch() requires the pattern to consume the entire string, which you express here as ^pattern$ (with the trailing-newline caveat above) — the tester's highlight view makes partial matches obvious in a way fullmatch's silent False never does in code.",
        ],
      },
      {
        heading: "Backtracking, ReDoS, and the two-second ceiling",
        body: [
          "Python's sre engine and JavaScript's engine are both backtracking engines, which means they share the same failure mode: patterns with nested quantifiers — (a+)+$, (a|a)*, (a*)*b — take exponential time on non-matching input. In a web service that is a denial-of-service vector with a CVE-style name (ReDoS); in CPython it is a hung request. This tester runs every evaluation in a sandboxed Web Worker with a two-second budget and reports Catastrophic Backtracking Detected with the offending shape called out, so the pattern fails here — loudly — instead of in production, quietly.",
          "The structural fixes are the same in both languages. Bound the repetition, prefer character classes over alternation ((a|b)+ becomes [ab]+), anchor patterns so failure happens early, and for untrusted input consider whether a regular expression is even the right tool. If your service must run untrusted patterns, the industrial answer in Python is the google-re2 library, which guarantees linear time by giving up backreferences and lookarounds — the same trade-off this tester's timeout makes visible.",
        ],
      },
    ],
    cheatSheet: [
      { token: "(?P<name>…)", meaning: "Named capture group (Python spelling)", example: "(?P<year>\\d{4}) → groups.year" },
      { token: "(?P=name)", meaning: "Backreference to a named group", example: "(?P<w>\\w+) (?P=w) → repeated word" },
      { token: "\\A … \\Z", meaning: "Absolute string start / end", example: "\\A\\d+\\Z → digits only" },
      { token: "\\d \\w \\s", meaning: "Unicode-aware digit / word / space (Python 3 default)", example: "\\w+ → naïve OK" },
      { token: "(?i) (?m) (?s)", meaning: "Inline flags: ignore case, multiline, dot-all", example: "(?i)error → ERROR too" },
      { token: "(?a)", meaning: "ASCII-only shorthand classes", example: "(?a)\\w+ → ASCII words" },
      { token: "r'…'", meaning: "Raw string — keep backslashes for the engine", example: "r'\\d+' not '\\d+'" },
      { token: "(?(id)yes|no)", meaning: "Conditional pattern — not translatable to JS", example: "blocked with a reason" },
      { token: "(?>…)", meaning: "Atomic group (Python 3.11+) — not translatable to JS", example: "blocked with a reason" },
      { token: "re.VERBOSE (?x)", meaning: "Free-spacing mode — not translatable to JS", example: "blocked with a reason" },
    ],
    differences: [
      {
        construct: "Named groups",
        flavor: "(?P<name>...) and (?P=name)",
        javascript: "(?<name>...) and \\k<name> — rewritten automatically",
      },
      {
        construct: "Shorthand classes",
        flavor: "Unicode by default (str patterns)",
        javascript: "ASCII by default; u flag needed for parity — flagged in notices",
      },
      {
        construct: "String-end anchor",
        flavor: "\\Z never matches before a trailing newline",
        javascript: "$ (no m) does match before one trailing newline — notice attached",
      },
      {
        construct: "Inline flags",
        flavor: "(?i) allowed anywhere, can be scoped with (?i:...)",
        javascript: "Flags are whole-pattern only; leading (?i) is promoted, scoped forms are blocked",
      },
      {
        construct: "Verbose mode",
        flavor: "re.VERBOSE / (?x) ignores whitespace and # comments",
        javascript: "No equivalent — rejected with guidance",
      },
      {
        construct: "Atomic groups & possessive",
        flavor: "Python 3.11+ supports (?>...) and *+",
        javascript: "No equivalent — rejected with guidance",
      },
      {
        construct: "match() vs search()",
        flavor: "re.match anchors at start; re.search scans",
        javascript: "test/exec always scan; add ^ to emulate match()",
      },
      {
        construct: "Replacement refs",
        flavor: "\\g<name> in re.sub",
        javascript: "$<name> in replace()",
      },
    ],
    faqs: [
      {
        question: "Why does (?P<name>...) work here — isn't that Python-only syntax?",
        answer:
          "The translator rewrites it to JavaScript's (?<name>...) spelling before evaluation and shows the rewrite in the notices, so your pattern stays in Python syntax while the engine runs the translated form. The names you choose flow through to the match table's group panel the same way m.group('name') returns them in Python. (?P=name) backreferences get the same treatment and become \\k<name>.",
      },
      {
        question: "How do I test a re.VERBOSE pattern with comments and whitespace?",
        answer:
          "You cannot translate it automatically — ignoring whitespace and # comments is exactly the kind of semantic change a translator must not guess at, so verbose patterns are rejected with an explanation. Strip the comments and whitespace manually (or preprocess the pattern string with Python's re.VERBOSE rules in your own code) and test the condensed form here. The condensed pattern is what the engine ultimately matches anyway.",
      },
      {
        question: "Does $ in this tester behave like Python's $?",
        answer:
          "Almost. Python's $ matches at the end of the string and just before a newline at the end, and per line with re.MULTILINE — exactly like JavaScript's $ with and without the m flag. The difference hides in \\Z: Python's \\Z is the true absolute end and never matches before a trailing newline, while the JavaScript $ used to translate it does. The notice attached to every \\Z translation calls this out; when the distinction matters, keep a trailing newline in your test string and check whether the match extends past it.",
      },
      {
        question: "Are Python 3.11 atomic groups and possessive quantifiers supported?",
        answer:
          "No — they are rejected with a specific message. Atomic groups (?>...) and possessive quantifiers like a*+ or a++ prevent the engine from backtracking into the match, a performance guarantee JavaScript's engine cannot express (outside the experimental v flag). Silently dropping the possessive + would change results on crafted input, so the translator refuses rather than lies. ReDoS-shaped patterns still get caught by the two-second execution budget.",
      },
      {
        question: "How do I match Unicode word characters the way Python does?",
        answer:
          "Enable the u flag. Python 3 matches \\w, \\d, and \\s against Unicode by default — naïve, संस्कृत, and ＡＢＣ are word text — while JavaScript's defaults are ASCII-only. The tester attaches a notice to every shorthand class reminding you of this; with u on, the classes widen to code-point semantics close to Python's. For the reverse — forcing ASCII in Python — (?a) matches JavaScript's default behavior, so those patterns translate cleanly.",
      },
      {
        question: "Which Python constructs are rejected outright?",
        answer:
          "Verbose mode (?x), scoped or negative inline flags like (?i:...) and (?-i), atomic groups (?P>...) and (?>...), conditionals (?(group)yes|no), and the \\G anchor. Each is rejected with a message naming the construct and the reason — because in every case a faithful translation does not exist, and a silent approximation would report matches your Python code would not produce. Everything else — named groups, backreferences, lookaround, lazy quantifiers — translates or passes through natively.",
      },
    ],
  },
  {
    id: "php",
    slug: "php",
    title: "PHP Regex Tester — Test preg_match Patterns (PCRE) Online | SyntaxFiddle",
    heading: "PHP Regex Tester — PCRE Patterns for preg_match & preg_replace",
    description:
      "Test PHP preg_match patterns online: delimiters and modifiers are stripped automatically, \\h, \\R and \\Q..\\E are translated, and PCRE-only constructs like \\K and recursion are rejected with reasons. 100% client-side.",
    heroDescription:
      "Paste the pattern exactly as it appears between preg_match() delimiters — /pattern/i, #pattern#u, any delimiter you use — and the translator peels the delimiters, applies the modifiers, and rewrites PCRE constructs to their JavaScript equivalents, with a notice for every transformation and a precise rejection for the ones that cannot travel.",
    keywords: [
      "php regex tester",
      "preg_match tester",
      "pcre regex tester",
      "php regular expression tester",
      "preg_replace tester",
      "php regex online",
      "pcre online",
      "php preg tester",
      "pcre2 tester",
      "regex101 alternative php",
    ],
    featureList: [
      "Delimiter-aware: /pattern/i, #pattern#u, ~pattern~ — delimiters and trailing modifiers parsed automatically",
      "PCRE shorthand translated: \\h \\H \\v \\V \\R expanded to exact classes",
      "\\Q...\\E literal quoting expanded to explicitly escaped literals",
      "(?P<name>...), (?'name'...), and (?P=name) normalized to JavaScript syntax",
      "\\K, recursion (?R), subroutine calls, and callouts rejected with precise reasons — never silently approximated",
    ],
    facts: [
      PRIVACY_FACT,
      SPEED_FACT,
      HONESTY_FACT,
    ],
    sections: [
      {
        heading: "Delimiters and modifiers — the PHP wrapper, handled",
        body: [
          "PCRE patterns in PHP always wear a wrapper: a delimiter character (/, #, ~, %, {}, or any non-alphanumeric) around the pattern, optionally followed by modifier letters. preg_match('/#([0-9a-f]{6})/i', $css) carries the # delimiter and the i modifier. The tester accepts the wrapper whole — it detects a matching delimiter pair, strips them, maps i, m, s, and u to JavaScript flags, and rejects modifiers it cannot translate honestly (x verbose, U greedy-swap) rather than guessing. Bare, unwrapped patterns work too, for the times you are reasoning about engine-level syntax only.",
          "The four translatable modifiers map cleanly: i is case-insensitivity, m makes ^ and $ anchor per line, s is PCRE's dotall — the dot crossing newlines — and u switches PCRE to UTF-8 mode, which JavaScript's u flag approximates. What has no JavaScript twin is x (free-spacing), U (ungreedy swap, which inverts every quantifier's greediness), and e (long-removed eval-on-replace), and the tester names the offending modifier when it refuses — the error message tells you exactly which letter to resolve by hand.",
        ],
      },
      {
        heading: "The PCRE extensions that translate — and the ones that cannot",
        body: [
          "PCRE's everyday extensions mostly have JavaScript equivalents once rewritten: named groups in any of their three spellings — (?P<name>...), (?<name>...), (?'name'...) — normalize to (?<name>...), and named backreferences (?P=name) become \\k<name>. The horizontal and vertical whitespace shorthands \\h, \\H, \\v, and \\V expand to explicit character classes covering exactly the code points PCRE defines; \\R — any line break, with CRLF kept atomic — becomes an alternation that preserves the CRLF-pairing behavior a naive [\\r\\n] would break. \\Q...\\E literal quoting, the PHP idiom for embedding verbatim text, expands to an explicitly escaped literal.",
          "The hard boundary is the PCRE feature set with no JavaScript counterpart: \\K resets where the reported match starts, recursion constructs (?R) and (?1) match nested structures recursively, subroutines (?&name) reuse group definitions, callouts (?C) invoke code mid-pattern, and atomic groups (?>...) and possessive quantifiers a++ suppress backtracking. Each is rejected with a message naming the construct — because every one of them would change what matches, not just how it is spelled, and a translator that approximated them would hand you matches your PHP code will not produce.",
        ],
      },
      {
        heading: "preg_match, preg_match_all, and what the flags bar means",
        body: [
          "The tester's global mode is preg_match_all() — every match, in order, with named groups broken out per match just as PREG_SET_ORDER arranges them. Turning global off is preg_match(): first match only. The named-group panel mirrors the $matches array's string keys; the numeric capture groups mirror its integer keys. If your production call uses PREG_OFFSET_CAPTURE, the match table's [start, end) offsets are those same byte-ish positions — UTF-8 code units in JavaScript versus bytes in PHP, a difference that matters only for multi-byte text, where offsets should be treated as logical rather than byte positions.",
          "preg_replace_callback() and preg_replace() map to the replace flows you would expect, including $1 and \\1 and named ${name} substitution — but the pattern side is where this tool earns its keep: a replaced capture group boundary bug is visible instantly in the highlight view, where alternating match colors and per-group underlines show exactly what each group consumed. For the classic 'match HTML tags' family of patterns, the ReDoS guard also catches the ones that will hang: nested quantifier shapes are terminated at two seconds with the shape called out by name.",
        ],
      },
      {
        heading: "UTF-8 mode, bytes, and code points",
        body: [
          "Without the u modifier, PCRE operates on bytes — the dot matches one byte, not one character, and multi-byte UTF-8 text produces offset and match behavior that surprises everyone once. With u, PCRE validates the subject as UTF-8 and switches to code-point semantics. JavaScript's engine is natively code-unit based and becomes code-point based with its own u flag, which is why the tester maps PHP's u modifier to JavaScript's u and attaches a notice: close parity for matching behavior, with the caveat that JavaScript never rejects invalid UTF-8 the way PCRE's u mode does — browsers normalize malformed sequences before the engine ever sees them.",
          "The practical guidance is boring and valuable: if your production pattern carries the u modifier, test here with u on; if it does not, test against single-byte text or accept that byte-versus-code-unit offsets diverge on multi-byte input. And when a pattern needs Unicode properties — \\p{L}, \\p{N}, \\p{Han} — PCRE requires u and JavaScript does too; those constructs pass through with the flag auto-added and a note confirming the property-name vocabulary you rely on is shared between the two engines.",
        ],
      },
    ],
    cheatSheet: [
      { token: "/pattern/i", meaning: "Delimiter + case-insensitive modifier (auto-parsed)", example: "/api/i → matches API" },
      { token: "\\h \\H", meaning: "Horizontal whitespace / its negation", example: "\\h+ → spaces and tabs" },
      { token: "\\v \\V", meaning: "Vertical whitespace / its negation", example: "\\v → \\n, \\r, VT, FF" },
      { token: "\\R", meaning: "Any line-break sequence, CRLF atomic", example: "a\\Rb → a\\r\\nb" },
      { token: "\\Q…\\E", meaning: "Quote literal text until \\E", example: "\\Q1+1=2\\E → literal" },
      { token: "(?P<name>…)", meaning: "Named group (PCRE spelling)", example: "(?P<id>\\d+) → groups.id" },
      { token: "(?&name)", meaning: "Subroutine call — not translatable", example: "blocked with a reason" },
      { token: "(?R)", meaning: "Full-pattern recursion — not translatable", example: "blocked with a reason" },
      { token: "\\K", meaning: "Reset match start — not translatable", example: "blocked with a reason" },
      { token: "a*+ / (?>a)", meaning: "Possessive / atomic — not translatable", example: "blocked with a reason" },
    ],
    differences: [
      {
        construct: "Pattern wrapper",
        flavor: "Delimiters + trailing modifiers (/…/imsxu)",
        javascript: "Bare pattern + separate flags — wrapper parsed automatically",
      },
      {
        construct: "Named groups",
        flavor: "(?P<name>...), (?<name>...), (?'name'...)",
        javascript: "(?<name>...) — all spellings normalized",
      },
      {
        construct: "\\h \\v \\R",
        flavor: "Horizontal / vertical / any-linebreak classes",
        javascript: "Expanded to explicit classes automatically",
      },
      {
        construct: "\\K",
        flavor: "Match start reset — report from here onward",
        javascript: "No equivalent — rejected (use a capture group instead)",
      },
      {
        construct: "Recursion (?R) (?1)",
        flavor: "Matches nested balanced structures",
        javascript: "No equivalent — rejected with guidance",
      },
      {
        construct: "Possessive / atomic",
        flavor: "a*+ and (?>...) suppress backtracking",
        javascript: "No equivalent — rejected with guidance",
      },
      {
        construct: "UTF-8 mode",
        flavor: "u modifier validates UTF-8 and switches to code points",
        javascript: "u flag approximates; invalid sequences are normalized upstream",
      },
      {
        construct: "Offsets",
        flavor: "PREG_OFFSET_CAPTURE returns byte offsets",
        javascript: "Offsets are UTF-16 code units — treat as logical positions",
      },
    ],
    faqs: [
      {
        question: "Do I need to strip the /.../ delimiters before pasting?",
        answer:
          "No — paste the whole thing, delimiters and modifiers included. The tester detects a matched delimiter pair, removes them, and maps the trailing modifiers to JavaScript flags: i, m, s, and u translate directly; x, U, and other PCRE-only modifiers are refused with a message naming the exact letter. If you paste a bare pattern instead, it is evaluated as-is with the flags you choose in the flag bar.",
      },
      {
        question: "Why is my \\K pattern rejected?",
        answer:
          "\\K tells PCRE to report the match starting from that point — foo\\Kbar matches bar but returns it as if the match began there. JavaScript has no way to shift a match's reported start, so any translation would return different offsets and different replace() output than your PHP code. The rejection message suggests the standard restructure: use a capture group around the part you care about (foo(bar)) and read group 1 — same result, portable pattern.",
      },
      {
        question: "How do I test recursion patterns for nested parentheses?",
        answer:
          "The classic \\((?:[^()]|(?R))*\\) pattern is rejected, because JavaScript's engine cannot call itself recursively. The workaround family works in both languages: iterate a counter-based grammar in code, use a parsing library for nested structures, or — for bounded nesting — unroll the recursion into a fixed number of levels like (?:\\((?:[^()]|\\([^()]*\\))*\\)). The tester is honest about this boundary rather than pretending the recursion ran.",
      },
      {
        question: "What do the notices under the pattern input mean?",
        answer:
          "Every notice documents one concrete translation the tool performed — POSIX or PCRE class expansions, named-group rewrites, anchor mappings, delimiters stripped, flags added — or a semantic caveat you should know about (case sensitivity, Unicode width, trailing-newline behavior). The rewritten JavaScript pattern is shown alongside so you can see exactly what the engine evaluated. Nothing is rewritten silently; if the tool cannot preserve meaning, it errors instead.",
      },
      {
        question: "Does preg_replace's ${1} substitution work the same in JavaScript?",
        answer:
          "Yes — PHP's ${name} and $1 substitution in preg_replace map to JavaScript's $<name> and $1 in String.replace(). Capture-group numbering and naming behave identically after the named-group syntax is normalized, so a pattern validated here with named groups drops into preg_replace_callback with the same $matches['name'] keys the group panel shows. Offsets differ only on multi-byte subjects, where PHP reports bytes and JavaScript code units.",
      },
      {
        question: "Why does my pattern fail with 'modifier cannot be translated'?",
        answer:
          "Because a trailing modifier has no honest JavaScript equivalent. The x modifier makes whitespace and # comments insignificant — a semantic change a translator must not guess at. U inverts every quantifier's greediness, which changes results, not spelling. Those patterns are refused with the offending modifier named; resolve it by hand (remove whitespace/comments for x, flip each quantifier's laziness for U) and the rest of the pattern will translate fine.",
      },
    ],
  },
  {
    id: "java",
    slug: "java",
    title: "Java Regex Tester — Test java.util.regex Patterns Online | SyntaxFiddle",
    heading: "Java Regex Tester — java.util.regex.Pattern, Translated Live",
    description:
      "Test Java regex patterns online: \\p{Alpha} classes, \\Q...\\E quoting, and named groups are translated with notices; possessive quantifiers are rejected honestly. 100% client-side evaluation.",
    heroDescription:
      "Write patterns in java.util.regex dialect — POSIX-style \\p{Alpha} properties, \\Q...\\E literal quoting, named groups as (?<host>...) — and the translator expands each to its JavaScript equivalent in real time, showing every rewrite. Constructs Java supports that JavaScript cannot express, like possessive quantifiers, are rejected with the exact reason.",
    keywords: [
      "java regex tester",
      "java regular expression tester",
      "java.util.regex tester",
      "java pattern tester",
      "java regex online",
      "java regex tester online",
      "java matcher tester",
      "java regex debugger",
      "java pattern matcher online",
      "jshell regex",
    ],
    featureList: [
      "\\p{Alpha}, \\p{Digit}, \\p{Alnum} and friends expanded to their exact ASCII Java classes",
      "\\Q...\\E literal quoting expanded to explicitly escaped literals",
      "\\p{L} general-category escapes passed through with the u flag added automatically",
      "\\A, \\z, \\Z anchors mapped to ^ and $ with the trailing-newline distinction documented",
      "Possessive quantifiers (a*+, a++) rejected with a precise reason — they cannot be expressed in JavaScript",
    ],
    facts: [
      PRIVACY_FACT,
      SPEED_FACT,
      HONESTY_FACT,
    ],
    sections: [
      {
        heading: "Pattern and Matcher — the API this tester mirrors",
        body: [
          "Java regex lives behind two classes: Pattern.compile() turns source text into a compiled pattern, and Matcher walks a subject string. The API's three entry points map directly onto what this tester shows you: matcher.find() is the tester's global mode (each call advances to the next match, like the match table's rows), matcher.matches() requires the entire region to match (that is ^pattern$ here), and matcher.lookingAt() anchors at the start without requiring the end (that is ^pattern alone). If a pattern validates in global mode but your production matches() call returns false, the difference is anchoring — the highlight view shows exactly where the match stopped short of the string end.",
          "Group semantics carry over one-to-one. Java's numbered groups are m.group(1) through m.group(N); named groups — supported since Java 7 — are m.group(\"name\"), and the tester's group panel shows the same names with the same values. The region API (matcher.region(start, end)) has no flag equivalent, but slicing the test string before pasting reproduces it exactly. One Java-only nicety worth knowing when you go back to code: Pattern is immutable and thread-safe, and compile once, reuse across threads is the idiomatic — and safe — pattern.",
        ],
      },
      {
        heading: "\\p{...} — Java's POSIX shortcuts versus Unicode categories",
        body: [
          "Java accepts two \\p{...} vocabularies that are easy to conflate. The POSIX-inspired shortcuts — \\p{Alpha}, \\p{Digit}, \\p{Alnum}, \\p{Upper}, \\p{Lower}, \\p{Punct}, \\p{XDigit} — are ASCII-only by default, matching exactly [A-Za-z] and friends; with Pattern.UNICODE_CHARACTER_CLASS they widen to Unicode. The general-category escapes — \\p{L} (letter), \\p{N} (number), \\p{Lu} (uppercase letter) — are Unicode from the start. The tester expands the ASCII shortcuts to explicit classes (and notes that the UNICODE_CHARACTER_CLASS variant is broader), while general categories pass through with JavaScript's u flag added, since the two engines share that vocabulary.",
          "Java's Is-prefixed block escapes — \\p{IsBasicLatin}, \\p{IsGreek} — have no reliable JavaScript equivalent: JavaScript exposes scripts (\\p{Script=Greek}) and a different block taxonomy, so the translator rejects them with that explanation rather than mapping IsLatin to something approximately similar. If you need script-level matching in portable code, \\p{Script=...} works in both Java (as \\p{script=Greek}, Java 7+) and JavaScript with u — that is the shared, safe vocabulary.",
        ],
      },
      {
        heading: "\\Q...\\E and the escaping discipline",
        body: [
          "Java programmers meet \\Q...\\E through Pattern.quote(): it quotes literal text so metacharacters lose their meaning — invaluable when a user-supplied string must be matched verbatim inside a larger pattern. The translator expands \\Q...\\E to an explicitly escaped literal, so the quoted region survives translation with its meaning intact, and the notice tells you the expansion happened. In Java code, reach for Pattern.quote() at the boundary where data becomes pattern; here, paste the quoted form and the expansion is done for you.",
          "The escaping discipline around user input is the same in both languages: never interpolate raw input into a pattern, because parentheses, brackets, and backslashes all change meaning. Java's Matcher also offers Matcher.quoteReplacement() for the replacement side — the fix for $ and \\ in replacement strings — which maps to JavaScript's replacement-string escaping of $ as $$. Both are small APIs that prevent whole classes of bugs, and both are worth using even when the pattern side feels safe.",
        ],
      },
      {
        heading: "Anchors, boundaries, and the possessive wall",
        body: [
          "Java and JavaScript agree on more anchor semantics than most flavor pairs: \\b word boundaries, \\B non-boundaries, and lookbehind (Java's must be bounded-length; JavaScript's allows unbounded) all translate by passthrough. The difference concentrates at the string's end: Java's \\z is the true absolute end, \\Z matches before a final newline, and $ matches before a final newline unless MULTILINE makes it per-line. JavaScript's $ (no m) is Java's \\Z exactly, so the translator maps \\z and \\Z both to $ and attaches the caveat — if you are validating that no trailing newline survives (trimmed fields, tokens), test with the newline present.",
          "The hard wall is possessive quantifiers and atomic groups: a*+, a++, (?>ab) suppress backtracking into the atom, and JavaScript's engine simply cannot express that (the experimental v flag aside). The translator rejects them by name because dropping the + would change match results on crafted input — the exact failure a tester exists to prevent. The standard Java-side alternatives — rewriting with lookahead emulation or bounded alternation — work in both languages, and the ReDoS guard here still catches the catastrophic shapes possessive quantifiers were usually invented to fix.",
        ],
      },
    ],
    cheatSheet: [
      { token: "\\p{Alpha}", meaning: "ASCII letter (Java POSIX shortcut)", example: "\\p{Alpha}+ → Acme" },
      { token: "\\p{Digit}", meaning: "ASCII digit", example: "\\p{Digit}{3} → 123" },
      { token: "\\p{Alnum}", meaning: "ASCII letter or digit", example: "\\p{Alnum}+ → a1B2" },
      { token: "\\p{L}", meaning: "Unicode letter (general category)", example: "\\p{L}+ → naïve" },
      { token: "\\Q…\\E", meaning: "Quote literal text", example: "\\QC++\\E → literal C++" },
      { token: "(?<name>…)", meaning: "Named group (Java 7+)", example: "(?<host>\\w+\\.\\w+)" },
      { token: "\\A \\z \\Z", meaning: "Start / absolute end / end before final newline", example: "\\A\\d+\\z" },
      { token: "\\b", meaning: "Word boundary", example: "\\bvoid\\b → not avoid" },
      { token: "a*+", meaning: "Possessive quantifier — not translatable", example: "blocked with a reason" },
      { token: "(?>ab)", meaning: "Atomic group — not translatable", example: "blocked with a reason" },
    ],
    differences: [
      {
        construct: "POSIX \\p{...} shortcuts",
        flavor: "\\p{Alpha} etc., ASCII by default; Unicode with UNICODE_CHARACTER_CLASS",
        javascript: "Expanded to exact ASCII classes; Unicode variant noted",
      },
      {
        construct: "\\Q...\\E",
        flavor: "Literal quoting (also Pattern.quote())",
        javascript: "Expanded to an explicitly escaped literal",
      },
      {
        construct: "String end",
        flavor: "\\z absolute; \\Z before final newline; $ like \\Z unless MULTILINE",
        javascript: "$ maps to \\Z behavior — caveat attached",
      },
      {
        construct: "Possessive / atomic",
        flavor: "a*+, a++, (?>...) supported since Java 1.4",
        javascript: "No equivalent — rejected with the reason",
      },
      {
        construct: "Lookbehind",
        flavor: "Must be finite, bounded length",
        javascript: "Allows unbounded — patterns legal here may fail to compile in Java",
      },
      {
        construct: "Named groups",
        flavor: "(?<name>...) since Java 7",
        javascript: "Identical syntax — passes through",
      },
      {
        construct: "Matching model",
        flavor: "find() iterates; matches() requires full match",
        javascript: "Global mode is find(); ^…$ emulates matches()",
      },
      {
        construct: "Blocks",
        flavor: "\\p{IsBasicLatin} and Is-block escapes",
        javascript: "Not supported — use \\p{Script=...}, shared by both",
      },
    ],
    faqs: [
      {
        question: "Why is my possessive quantifier rejected?",
        answer:
          "Java's a*+ and (?>...) disable backtracking into the atom — a performance control JavaScript's engine cannot express. Dropping the + or unwrapping the atomic group would leave a pattern that matches differently on crafted input, so the translator refuses with a message saying exactly that. If the possessive quantifier was there to fight catastrophic backtracking, the tester's two-second ReDoS budget will surface whether the non-possessive form is actually safe.",
      },
      {
        question: "Does \\p{Alpha} match Unicode letters here?",
        answer:
          "Not by default — and that is correct Java behavior. \\p{Alpha} is ASCII-only unless the pattern is compiled with Pattern.UNICODE_CHARACTER_CLASS, in which case it widens to Unicode letters. The tester expands \\p{Alpha} to its exact ASCII class and attaches a notice about the wider variant. For intentionally Unicode matching, use the general-category escape \\p{L} instead: it is Unicode-first in Java and translates here with the u flag added automatically.",
      },
      {
        question: "How do \\z and \\Z translate, and why do I care?",
        answer:
          "Java's \\z matches only the true end of input; \\Z also matches just before a single trailing newline — and JavaScript's $ (without the m flag) behaves exactly like \\Z. The translator maps both to $ and documents the difference in a notice. It matters when validating fields where a trailing newline must not pass: with \\z semantics in mind, keep a newline at the end of your test string and check whether the match still extends to it.",
      },
      {
        question: "Can I test lookbehind that Java would reject?",
        answer:
          "Possibly, yes — and that is a real fidelity boundary. Java requires lookbehind alternatives to have bounded, computable length; JavaScript accepts unbounded lookbehind like (?<=ab*)c. A pattern using unbounded lookbehind can therefore validate here and still throw when compiled in Java. Keep Java's restriction in mind for lookbehind containing * or +; fixed-length lookbehind like (?<=\\$) works identically in both.",
      },
      {
        question: "How does this tester's output map to Matcher methods?",
        answer:
          "The match table is matcher.find() in a loop: one row per match, in order, with span offsets like m.start() and m.end(). The named-group panel is m.group(\"name\"); the whole-match row is m.group(). Turning global mode off gives you a single matcher.find() call. matcher.matches() — the full-string variant — is expressed by anchoring with ^ and $, and matcher.lookingAt() by a leading ^ alone.",
      },
      {
        question: "Is Pattern.quote() the same as \\Q...\\E?",
        answer:
          "Pattern.quote(\"text\") returns \\Qtext\\E — the API method is literally a wrapper around the quoting syntax, with a fallback to escaping when the text contains \\E. The tester expands any pasted \\Q...\\E region to an explicitly escaped literal, so both forms work. The rule it enforces is the one worth internalizing: data interpolated into patterns must be quoted, whether by Pattern.quote(), \\Q...\\E, or — in your own Java code — by not building patterns from user input at all.",
      },
    ],
  },
  {
    id: "dotnet",
    slug: "dotnet",
    title: ".NET Regex Tester — Test C# Regular Expressions Online | SyntaxFiddle",
    heading: ".NET Regex Tester — C# System.Text.RegularExpressions, Live",
    description:
      "Test C# / .NET regex patterns online: (?'name'...) groups, inline (?i) flags, and \\A \\z anchors are translated with notices; balancing groups are rejected honestly. 100% client-side.",
    heroDescription:
      "Write patterns the way they appear in new Regex(...) or Regex.Match — named groups in either .NET spelling, leading inline flags, RegexOptions-shaped semantics — and the translator normalizes them for the evaluation engine, showing each rewrite. Constructs that cannot travel, like balancing groups and scoped (?i:...), are rejected with precise reasons.",
    keywords: [
      ".net regex tester",
      "c# regex tester",
      "c# regular expression tester",
      "regex c# online",
      "system.text.regularexpressions tester",
      "c# pattern tester",
      "regex101 c#",
      "dotnet regex tester",
      "c# regex online test",
      "c# regex debugger",
    ],
    featureList: [
      "Both .NET named-group spellings — (?<name>...) and (?'name'...) — normalized to JavaScript syntax",
      "Leading inline flags (?i), (?m), (?s) promoted to pattern flags with notices",
      "\\A, \\z, \\Z anchors mapped to ^ and $ with the trailing-newline distinction documented",
      "Unicode-by-default \\d \\w \\s flagged with u-flag guidance for parity",
      "Balancing groups, scoped (?i:...) flags, and (?n) explicit-capture rejected with exact reasons",
    ],
    facts: [
      PRIVACY_FACT,
      SPEED_FACT,
      HONESTY_FACT,
    ],
    sections: [
      {
        heading: "Regex, Regex.Match, and the shape of everyday .NET code",
        body: [
          ".NET regex usage clusters around a few idioms: the static Regex.Match(subject, pattern) and Regex.Matches(...) for one-off calls, instance regexes for reuse, and — since .NET 7 — the generated source generator ([GeneratedRegex(...)]) that compiles the pattern at build time. The tester's global mode is Regex.Matches(): one row per Match in the returned MatchCollection, with named groups per row exactly like match.Groups[\"name\"].Value. Single-match mode is Regex.Match(); Success is the tester's 'no matches found' state.",
          "The APIs the tester cannot simulate are still worth planning around. .NET's Regex supports a match timeout (TimeSpan) precisely because catastrophic backtracking takes down services — the same threat model this tester enforces with its two-second worker budget and Catastrophic Backtracking Detected report. RegexOptions.IgnoreCase, Multiline, and Singleline map to the i, m, and s flags on the flag bar; IgnorePatternWhitespace is .NET's verbose mode and, like PCRE's x, is rejected rather than approximated. If your production pattern carries a timeout, treat a tester rejection as your timeout firing early.",
        ],
      },
      {
        heading: "Named groups in both spellings — and the balancing-group wall",
        body: [
          ".NET accepts two named-group spellings — (?<name>...) and (?'name'...) — and the translator normalizes both to the form JavaScript shares. Named groups are the backbone of the nicest .NET regex feature set: match.Groups[\"name\"], ${name} substitution in Regex.Replace, and named capture in routed templates. The tester's group panel speaks the same vocabulary, so a pattern validated here carries its names straight into production code. One spelling caution: a hyphenated name like (?<a-b>...) is not a name at all — it is a balancing group definition, and it is rejected with that exact explanation.",
          "Balancing groups — (?<'Before-After'>...) — are .NET's mechanism for matching nested balanced constructs (every open paren has its close), built on the stack discipline of previous captures. They are genuinely useful and genuinely untranslatable: no other mainstream engine has them. The honest rejection message points at the alternatives that do travel — parser combinators, recursive descent, or counter-based matching in code — which is the same advice the .NET team gives for expression-sized problems that outgrow regex.",
        ],
      },
      {
        heading: "Inline flags, RegexOptions, and Unicode defaults",
        body: [
          ".NET allows inline flag letters anywhere in a pattern and can scope them with (?i:...) groups — a subexpression that is case-insensitive while the rest of the pattern stays sensitive. JavaScript supports flags only whole-pattern, so the translator promotes leading (?i), (?m), and (?s) to flags and rejects scoped or mid-pattern forms with an explanation, because dropping the scope would change what matches. The negative forms (?-i) and composite (?im-sx) are rejected for the same reason: turning flags off midway is not a thing JavaScript can do.",
          "The Unicode defaults run opposite to Java's: .NET's \\d, \\w, and \\s are Unicode-aware unless RegexOptions.ECMAScript narrows them, while JavaScript's are ASCII unless u widens them. The translator attaches a notice to every shorthand class recommending the u flag for parity, and that notice is not decoration — on internationalized data, ASCII-only matching silently skips rows. General categories and scripts (\\p{L}, \\p{IsGreek} on the .NET side versus \\p{Script=Greek} in JavaScript) pass through where the vocabularies overlap, and the Is-block escapes .NET uses are rejected where they do not.",
        ],
      },
      {
        heading: "Anchors, substitutions, and the $<newline> corner",
        body: [
          "The anchor map is the one to keep close. .NET's \\A is absolute start (JavaScript's ^ with m off); .NET's \\z is absolute end; .NET's \\Z matches before a final newline — which is exactly JavaScript's $ with m off. The translator maps \\A, \\z, and \\Z onto ^ and $ with a notice documenting which corner case differs: JavaScript's $ matching before one trailing newline. In .NET, $ without RegexOptions.Multiline matches at the end of the string or before a final newline — the same shape — so multiline workflows map cleanly: .NET MultILINE is JavaScript m, anchoring ^ and $ per line in both.",
          "Replacement strings round out the portability story: .NET's ${name} and $1 substitutions in Regex.Replace map to JavaScript's $<name> and $1 in String.replace(), with the same capture numbering the group panel shows. .NET's substitution extras — $$ for a literal dollar, $& for the whole match — have JavaScript twins with the same spelling. The one substitution API without a twin is MatchEvaluator (the lambda form of Regex.Replace); its equivalent is JavaScript's replace with a function callback, which is the same idea in different clothes.",
        ],
      },
    ],
    cheatSheet: [
      { token: "(?<name>…)", meaning: "Named group (.NET spelling #1)", example: "(?<area>\\d{3})" },
      { token: "(?'name'…)", meaning: "Named group (.NET spelling #2)", example: "(?'line'\\d{4})" },
      { token: "(?<a-b>…)", meaning: "Balancing group — not translatable", example: "blocked with a reason" },
      { token: "(?i) (?m) (?s)", meaning: "Inline flags at pattern start", example: "(?i)error → ERROR" },
      { token: "(?i:…)", meaning: "Scoped inline flag — not translatable", example: "blocked with a reason" },
      { token: "\\A \\z \\Z", meaning: "Start / absolute end / end before final newline", example: "\\A\\d+\\z" },
      { token: "\\d \\w \\s", meaning: "Unicode by default in .NET", example: "\\w+ → naïve OK" },
      { token: "${name}", meaning: "Named substitution in Regex.Replace", example: "${area}-${line}" },
      { token: "$&", meaning: "Whole match in substitution", example: "\"$&!\"" },
      { token: "TimeSpan", meaning: "Match timeout — echoed by the 2s ReDoS guard here", example: "new Regex(p, opts, TimeSpan.FromSeconds(1))" },
    ],
    differences: [
      {
        construct: "Named groups",
        flavor: "(?<name>...) and (?'name'...)",
        javascript: "(?<name>...) — both spellings normalized",
      },
      {
        construct: "Balancing groups",
        flavor: "(?<a-b>...) match nested balanced constructs",
        javascript: "No equivalent — rejected with guidance",
      },
      {
        construct: "Inline flags",
        flavor: "Anywhere, scoped with (?i:...), negative with (?-i)",
        javascript: "Whole-pattern only; leading forms promoted, scoped rejected",
      },
      {
        construct: "Shorthand classes",
        flavor: "\\d \\w \\s are Unicode by default",
        javascript: "ASCII by default; u flag needed for parity — flagged",
      },
      {
        construct: "String end",
        flavor: "\\z absolute; \\Z before final newline; $ like \\Z",
        javascript: "$ (no m) behaves like \\Z — caveat attached",
      },
      {
        construct: "Timeouts",
        flavor: "Regex(...) accepts a TimeSpan match timeout",
        javascript: "This tester's 2-second worker budget is the equivalent guard",
      },
      {
        construct: "Substitutions",
        flavor: "${name}, $1, $&, $$ in Regex.Replace",
        javascript: "$<name>, $1, $&, $$ in String.replace()",
      },
      {
        construct: "Unicode blocks",
        flavor: "\\p{IsBasicLatin} and Is-block escapes",
        javascript: "Scripts and categories instead — \\p{Script=Latin} with u",
      },
    ],
    faqs: [
      {
        question: "Why is my balancing group rejected?",
        answer:
          "Balancing groups — (?'Open-Close'...) or (?<Open-Close>...) — maintain a capture stack and are .NET's mechanism for matching nested balanced text like parentheses or XML tags. No other mainstream engine has them, so there is no translation that preserves meaning; the rejection names the construct. For nested structures, use a parser (or counter-based scanning in code) — the same direction the .NET documentation itself points when regex outgrows the problem.",
      },
      {
        question: "Does (?i) work the same here as in C#?",
        answer:
          "At the start of a pattern, yes — the translator promotes (?i) to the i flag and notes it. The .NET-only superpowers are rejected: scoped groups like (?i:subexpression), mid-pattern flags, and negative forms like (?-i) cannot be expressed whole-pattern in JavaScript, and approximating them would change what matches. If you need scoped case-insensitivity, split the pattern so the insensitive part is its own pattern, or restructure with explicit [Aa] classes.",
      },
      {
        question: "Why does \\w here only match ASCII until I add u?",
        answer:
          "Because the engines' defaults are opposite: .NET's \\d, \\w, and \\s are Unicode-aware unless RegexOptions.ECMAScript narrows them, while JavaScript's are ASCII-only unless the u flag widens them. The translator attaches a notice recommending u for parity, and with u on, the classes cover code-point text close to .NET's behavior. Test with the actual international characters you expect — that is the only way to see which side of the default your data lands on.",
      },
      {
        question: "How do the 2-second budget and .NET's Regex timeout compare?",
        answer:
          "They exist for the same reason. .NET lets you pass a TimeSpan to new Regex(pattern, options, timeout) — or set Regex.MatchTimeout app-wide — so a catastrophic pattern throws RegexMatchTimeoutException instead of hanging a thread. This tester enforces the same discipline client-side: evaluation runs in a Web Worker with a two-second budget, and exceeding it reports Catastrophic Backtracking Detected with the offending shape. A pattern rejected here is a pattern that would burn your .NET timeout too — fix the shape, not the timeout.",
      },
      {
        question: "Can I test RegexOptions.IgnorePatternWhitespace patterns?",
        answer:
          "No — verbose mode is rejected, because ignoring whitespace and # comments inside the pattern is a semantic transformation a translator cannot perform safely (which whitespace is ignored changes what matches). Write the pattern without internal whitespace and comments here. In C# code, keep using IgnorePatternWhitespace for readability — then test the de-commented, de-whitespaced form here, since that is what the engine ultimately compiles anyway.",
      },
      {
        question: "How do I map this tester's groups to C# code?",
        answer:
          "The group panel is match.Groups[\"name\"].Value for named groups and match.Groups[i] for numbered ones; the offsets column is match.Index and match.Index + match.Length. Global mode is Regex.Matches() iterating a MatchCollection; single-match mode is Regex.Match(). Substitutions translate directly: ${name} becomes $<name> and $& stays $& when you move from Regex.Replace to JavaScript's replace — same captures, same values.",
      },
    ],
  },
];

const CONTENT_BY_SLUG: Map<string, RegexFlavorContent> = new Map(
  REGEX_FLAVOR_CONTENT.map((content) => [content.slug, content]),
);

export function getRegexFlavorContent(slug: string): RegexFlavorContent | undefined {
  return CONTENT_BY_SLUG.get(slug);
}
