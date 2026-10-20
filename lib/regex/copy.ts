export type RegexSeoSection = {
  heading: string;
  body: string[];
};

export type CheatSheetRow = {
  token: string;
  meaning: string;
  example: string;
};

const SECTIONS: RegexSeoSection[] = [
  {
    heading: "A faithful JavaScript RegExp flavor — what you see is what ships",
    body: [
      "This tester evaluates your pattern with the same engine that renders the page: the browser's native ECMAScript RegExp implementation. There is no PCRE, Python, or Go translation layer silently changing semantics, so a pattern that highlights here behaves identically inside new RegExp(pattern, flags) in your production JavaScript — copy both across and the results match. The tool also supports the constructs that distinguish modern JavaScript from older regex flavors: named capture groups written (?<name>...), lookbehind and lookahead assertions, non-capturing groups, and the u flag's Unicode property escapes such as \\p{Letter}.",
      "The six supported flags — g, i, m, s, u, and y — are the complete set that changes matching semantics in JavaScript (the exotic d and v flags are intentionally not exposed). Toggle them in the top bar and both the highlighting and the match table recompute live. Because evaluation runs in a background Web Worker and keystrokes are debounced, the editor stays at interactive latency even against multi-megabyte test strings.",
    ],
  },
  {
    heading: "Catastrophic backtracking (ReDoS), and why your browser never freezes",
    body: [
      "JavaScript regexes are backtracking engines: when a match fails partway, the engine rewinds and retries every alternative way of splitting the input. For most patterns that is milliseconds of work, but certain shapes turn it combinatorial. Nested quantifiers are the notorious case — patterns like (a+)+$ or (a|a)* applied to a string of a's followed by a non-matching character force the engine to explore exponentially many partitions. Around twenty-five input characters can mean millions of redundant steps, and a single such evaluation can pin a CPU core for minutes. Fed from user input, that becomes ReDoS: a one-line regular expression used as a denial-of-service weapon.",
      "This tool assumes the worst on your behalf. Evaluation is dispatched to a dedicated Web Worker so the main thread — your scrolling, typing, and rendering — never blocks. A two-second execution budget is checked continuously between match iterations, and a watchdog on the main thread hard-terminates the worker entirely if a single backtracking call exceeds the budget. The result is an explicit Catastrophic Backtracking Detected error with guidance on the offending pattern shape, not a dead tab. If you see that error, you have just been shown exactly why the pattern does not belong in a server that accepts untrusted input.",
    ],
  },
  {
    heading: "Capture groups you can actually see",
    body: [
      "Adjacent matches are hard to tell apart when they all share one highlight color, so matches alternate across a four-color palette — a match never shares a background with the match next to it. Named capture groups go further: each group in every match is underlined in its own consistent color, in the editor and in the results panel, so you can trace which substring fed which name without counting parentheses. Optional groups that did not participate in a particular match are shown as an em dash rather than an ambiguous empty string.",
      "The results table lists every match with its exact span as [start, end) offsets. Those numbers are UTF-16 code-unit indices — the same units string.slice(), substring(), and match.index use in JavaScript — so you can lift them straight into code. One caveat inherits from the language itself: characters outside the Basic Multilingual Plane (emoji, rare CJK) occupy two code units, so a match boundary inside such a character is still reported in code units, exactly as match.index would report it in your application.",
    ],
  },
  {
    heading: "Flags that quietly rewrite what your pattern means",
    body: [
      "The g flag is the difference between one match and all of them: without it the engine stops at the first success, which is why a pattern that \"works\" in the console sometimes captures only the first row of your log file. i applies case folding so ERROR, Error, and error all match. m re-anchors ^ and $ from the whole string to each individual line, which is essential when testing patterns against multi-line logs or pasted config files.",
      "The remaining three are subtler and more consequential. s (dotAll) lets . finally match newline characters — without it, /a.b/ cannot span a line break no matter how many modifiers you add elsewhere. u switches the engine into Unicode mode: patterns become code-point aware instead of code-unit aware, invalid escapes become hard errors instead of silent identity matches, and \\p{...} property escapes unlock matching by script, category, or emoji status. y (sticky) anchors every attempt at lastIndex, succeeding only where the previous match ended — the behavior real tokenizers and parsers rely on for positional scanning.",
    ],
  },
];

export const REGEX_CHEAT_SHEET: CheatSheetRow[] = [
  { token: "\\d", meaning: "Any digit 0–9", example: "id=42 → matches 42" },
  { token: "\\w", meaning: "Word character: letter, digit, or underscore", example: "user_name → matches user_name" },
  { token: "\\s", meaning: "Any whitespace: space, tab, newline", example: "a b → matches the space" },
  { token: "\\D \\W \\S", meaning: "Negated forms of \\d, \\w, \\s", example: "a1 → \\D matches a" },
  { token: ".", meaning: "Any character except newline (with s: including newline)", example: "a.c → matches abc" },
  { token: "^", meaning: "Start of string (start of each line with m)", example: "^GET → matches lines starting GET" },
  { token: "$", meaning: "End of string (end of each line with m)", example: ";$ → matches a final semicolon" },
  { token: "\\b", meaning: "Word boundary between \\w and non-\\w", example: "\\bcat\\b → matches cat, not category" },
  { token: "*", meaning: "Zero or more of the previous item", example: "ab*c → matches ac, abc, abbc" },
  { token: "+", meaning: "One or more of the previous item", example: "a+ → matches aa in baah" },
  { token: "?", meaning: "Zero or one (optional); after * or +: lazy", example: "colou?r → matches color, colour" },
  { token: "{2,4}", meaning: "Between 2 and 4 repetitions", example: "\\d{2,4} → matches 2024" },
  { token: "[abc]", meaning: "Any one character in the set", example: "[aeiou] → matches a vowel" },
  { token: "[^abc]", meaning: "Any one character not in the set", example: "[^0-9] → matches a non-digit" },
  { token: "(…)", meaning: "Capturing group — numbered and reusable", example: "(\\d{4})-(\\d{2}) → two groups" },
  { token: "(?:…)", meaning: "Non-capturing group — groups without storing", example: "(?:ab)+ → matches abab" },
  { token: "(?<name>…)", meaning: "Named capture group — readable references", example: "(?<year>\\d{4}) → groups.year" },
  { token: "a|b", meaning: "Alternation — a or b (leftmost wins)", example: "cat|dog → matches either" },
  { token: "(?=…)", meaning: "Lookahead — must be followed by, but not consumed", example: "\\d+(?=px) → 12 in 12px" },
  { token: "(?!…)", meaning: "Negative lookahead — must not be followed by", example: "a(?!b) → a not before b" },
];

export const REGEX_FAQS = [
  {
    question: "Why does a pattern that works in another language fail here?",
    answer:
      "This tester runs the real JavaScript (ECMAScript) RegExp engine, which differs subtly from PCRE, Python, or Go flavors: different shorthand support, different possessive quantifier behavior, and hard errors on unknown escapes in Unicode mode. A pattern validated here is guaranteed to behave the same way in Node.js and browser JavaScript, which is the point — what you test is what you ship.",
  },
  {
    question: "What is catastrophic backtracking (ReDoS)?",
    answer:
      "Backtracking engines try every way to split a match when the overall match fails. Patterns with nested quantifiers — such as (a+)+$ or (a|a)* — applied to failing input explode exponentially: twenty-five characters can force millions of redundant attempts. In production this is a denial-of-service vector called ReDoS. This tool detects the stall, terminates evaluation at the two-second budget, and reports Catastrophic Backtracking Detected so you can fix the pattern before it ships.",
  },
  {
    question: "Why do my matches have different highlight colors?",
    answer:
      "Adjacent matches alternate across a four-color palette because same-colored neighboring highlights are hard to distinguish, especially for zero-width or tightly packed matches. The colors carry no meaning — they exist to make every match boundary visually obvious at a glance.",
  },
  {
    question: "How do I match text that spans multiple lines?",
    answer:
      "Two flags do different jobs: m makes ^ and $ anchor at the start and end of each line instead of the whole string, while s (dotAll) lets . match newline characters so expressions like a.*b can span line breaks. Testing a multi-line log usually wants both — enable m for per-line anchoring and s when a dot must cross newlines.",
  },
  {
    question: "What does the sticky (y) flag do?",
    answer:
      "Sticky matching anchors every attempt at the regex's lastIndex: the pattern can only match where the previous match ended, never later in the string. That is precisely the behavior tokenizers and parsers need for positional scanning, and this tester reflects it faithfully — a sticky pattern anchored at a non-matching position simply returns zero matches.",
  },
  {
    question: "Does \\d match only ASCII digits?",
    answer:
      "Yes — in JavaScript \\d, \\w, and \\s are ASCII-only by default, unlike some other flavors. Without the u flag, \\d matches 0–9, \\w matches A–Z, a–z, 0–9, and underscore, and \\s covers standard whitespace. To match digits or letters from other scripts, enable the u flag and use Unicode property escapes such as \\p{Nd} for any decimal digit in any script.",
  },
];

export function buildRegexSeoSections(): RegexSeoSection[] {
  return SECTIONS;
}
