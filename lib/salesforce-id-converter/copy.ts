/**
 * SEO copy for the /salesforce-id-converter/ landing page: technical prose
 * sections, FAQ entries, and the copy-paste Excel formula and Apex method.
 */

export interface IdConverterSection {
  heading: string;
  body: string[];
}

export interface IdConverterFaq {
  question: string;
  answer: string;
}

export const EXCEL_CHECK_CHAR_FORMULA =
  `// Excel — first check character (positions 1-5) of the 15-char Id in A1.\n` +
  `// Repeat with positions 6-10 and 11-15 for the second and third, then\n` +
  `// concatenate: =A1 & B1 & C1 & D1  (B1/C1/D1 hold the three check chars).\n` +
  `=MID("ABCDEFGHIJKLMNOPQRSTUVWXYZ012345",\n` +
  `  1\n` +
  `  + IF(AND(CODE(MID($A$1,1,1))>=65,CODE(MID($A$1,1,1))<=90),1,0)\n` +
  `  + IF(AND(CODE(MID($A$1,2,1))>=65,CODE(MID($A$1,2,1))<=90),2,0)\n` +
  `  + IF(AND(CODE(MID($A$1,3,1))>=65,CODE(MID($A$1,3,1))<=90),4,0)\n` +
  `  + IF(AND(CODE(MID($A$1,4,1))>=65,CODE(MID($A$1,4,1))<=90),8,0)\n` +
  `  + IF(AND(CODE(MID($A$1,5,1))>=65,CODE(MID($A$1,5,1))<=90),16,0),\n` +
  `  1)`;

export const APEX_TO18_METHOD =
  `public static String to18CharId(String id15) {\n` +
  `    if (id15 == null || (id15.length() != 15 && id15.length() != 18)) {\n` +
  `        throw new StringException('Expected a 15- or 18-character Salesforce Id');\n` +
  `    }\n` +
  `    if (id15.length() == 18) {\n` +
  `        return id15;\n` +
  `    }\n` +
  `    String alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ012345';\n` +
  `    String suffix = '';\n` +
  `    for (Integer chunk = 0; chunk < 3; chunk++) {\n` +
  `        Integer bits = 0;\n` +
  `        for (Integer i = 0; i < 5; i++) {\n` +
  `            String c = id15.substring(chunk * 5 + i, chunk * 5 + i + 1);\n` +
  `            if (c >= 'A' && c <= 'Z') {\n` +
  `                bits += 1 << i;\n` +
  `            }\n` +
  `        }\n` +
  `        suffix += alphabet.substring(bits, bits + 1);\n` +
  `    }\n` +
  `    return id15 + suffix;\n` +
  `}`;

const SECTIONS: IdConverterSection[] = [
  {
    heading: "Why Salesforce record IDs come in two lengths",
    body: [
      "Every Salesforce record has a 15-character Id made from upper- and lower-case letters plus digits — 62 possible characters per position, which packs a lot of uniqueness into a short string. The catch is that uniqueness depends on case: 0033000001QyXb5 and 0033000001qyxb5 are two different records. Systems that compare text case-insensitively — Excel's VLOOKUP and MATCH, most SQL collations, many marketing and data-warehouse platforms — silently treat those two Ids as identical, and joins start returning the wrong row or duplicating matches.",
      "The 18-character form fixes exactly that. Salesforce keeps the original 15 characters and appends three check characters computed from the case pattern of the original Id. Lowercase everything and the first 15 characters collapse, but the three appended characters still differ — so case-insensitive systems keep distinguishing the records. Salesforce APIs, Data Loader, SOQL WHERE clauses, and record URLs all accept both forms interchangeably, and the 18-character version is what external systems should store.",
    ],
  },
  {
    heading: "The check-character algorithm, step by step",
    body: [
      "The three extra characters are not random — they are a pure function of the first 15, so anyone can recompute them. Split the 15-character Id into three chunks of five characters. For each chunk, walk the five characters left to right and build a 5-bit number: position 1 is worth 1, position 2 is worth 2, then 4, 8, and 16, and a bit is set only when that character is an upper-case letter (digits and lower-case letters set nothing). The resulting 0-31 value maps onto the alphabet A-Z followed by the digits 0-5 — A for 0, B for 1, all the way to 5 for 31.",
      "Worked example: the chunk 0QyXb has upper-case Q at position 2 (worth 2) and upper-case X at position 4 (worth 8), giving 10, which maps to K. An all-digit chunk like 00330 scores 0 and maps to A. Run the tool above on any real Id and the suffix it produces will match what Salesforce itself appends — and for 18-character inputs the tool re-computes the suffix and flags mismatches, which is a quick way to catch Ids that were truncated or hand-edited in spreadsheets.",
    ],
  },
  {
    heading: "Converting 15 to 18 characters in Excel",
    body: [
      "Excel is where case-insensitivity bites hardest — VLOOKUP treats Abc and ABC as equal — so it is also where 18-character Ids earn their keep. You can compute the check characters with a formula, but beware the popular UPPER-based versions floating around: comparing a character with UPPER(itself) returns TRUE for digits too, which sets bits that should stay 0 and quietly produces a wrong suffix. A correct formula must test the character code explicitly, which CODE() makes easy: upper-case A-Z is 65-90 in every Excel locale.",
      "The formula below computes one check character from the first five positions of the Id in A1; duplicate it with positions 6-10 and 11-15 for the other two, then concatenate the Id with all three. It uses only classic functions, so it works in Excel 2016, LibreOffice, and Google Sheets unchanged. If you would rather not maintain three near-identical formulas, the tool above converts entire pasted columns at once and copies the results back as text — which also protects you from Excel's habit of reformatting long Ids.",
    ],
  },
  {
    heading: "Converting in Apex — and when you actually need to",
    body: [
      "Inside Salesforce, the 15-character Id is always safe: Apex and SOQL compare Ids case-sensitively, so Id fields, maps, and sets behave correctly without the suffix. The 18-character form matters at the boundary — exports to Excel, integrations with case-insensitive databases, external IDs loaded into third-party systems. When you generate such exports from Apex (a CSV built in a Batchable, a REST response), converting with the method below is a one-line call per row.",
      "The Apex implementation mirrors the algorithm exactly: three chunks of five characters, a bit per upper-case letter, one character from the A-Z0-5 alphabet per chunk. Copy the method into a utility class and unit-test it against known pairs — the fastest test is a round-trip: take any 15-character Id, convert it, truncate back to 15, and assert equality. And remember that going the other direction is trivial by design: dropping the last three characters always yields the original Id, which is why both directions in the tool above are lossless.",
    ],
  },
  {
    heading: "Object prefixes: what the first three characters tell you",
    body: [
      "The first three characters of any Salesforce Id are the object's key prefix: 001 for Account, 003 for Contact, 005 for User, 00Q for Lead, 500 for Case, 701 for Campaign. Standard objects keep the same prefixes in every org, which makes them genuinely useful — a glance at an exported Id tells you what it points at, and the tool above labels known prefixes automatically.",
      "The limits are just as important to know. Custom-object records use three-character prefixes that are generated per org, so a0B… means \"some custom object in this org\" and nothing more without that org's describe metadata. A few packaged and standard objects also ship org-specific prefixes. That is why unknown prefixes here are reported as org-specific rather than guessed: the tool only names prefixes that are universal, and any org-specific mapping is one describe call away inside Salesforce itself.",
    ],
  },
];

export const ID_CONVERTER_FAQS: IdConverterFaq[] = [
  {
    question: "What is the difference between a 15-character and an 18-character Salesforce ID?",
    answer:
      "Both identify the same record. The 15-character form is case-sensitive base62; the 18-character form appends three check characters computed from the case pattern of the first 15, making it safe to use in case-insensitive systems like Excel or most data warehouses. Salesforce APIs, SOQL, Data Loader, and record URLs accept both forms interchangeably.",
  },
  {
    question: "How do I convert a 15-digit Salesforce ID to an 18-digit ID?",
    answer:
      "Paste it into the converter above — the 18-character form appears instantly. In Apex, call the to18CharId utility method shown on this page. In Excel, use the CODE-based formula provided above (avoid UPPER-comparison formulas — they set bits for digits and produce wrong check characters). Bulk pastes of hundreds of Ids are supported in the Bulk tab.",
  },
  {
    question: "Why does Excel break my 15-character Salesforce IDs?",
    answer:
      "Excel's VLOOKUP, MATCH, and = comparisons are case-insensitive, so 003…QyXb5 and 003…qyxb5 compare as equal and joins match the wrong record. Use the 18-character form in spreadsheets — its case-parity suffix keeps distinct records distinct even after case is lost. Storing Ids as text (format the column first) also prevents Excel from mangling them as scientific notation.",
  },
  {
    question: "Can I convert an 18-character ID back to 15 characters?",
    answer:
      "Yes — the conversion is lossless by design. The last three characters of an 18-character ID are pure check data derived from the first 15, so truncating to 15 characters always recovers the original. The tool above shows both forms side by side and flags 18-character inputs whose suffix does not match, which usually means a copy-paste truncation or manual edit.",
  },
  {
    question: "What do the first three characters of a Salesforce ID mean?",
    answer:
      "They are the object's key prefix: 001 is Account, 003 Contact, 005 User, 00Q Lead, 500 Case, and so on. Standard objects share the same prefixes across every org. Custom-object prefixes (like a0B) are generated per org, so an unknown prefix means the object is custom or org-specific — the converter labels those explicitly instead of guessing.",
  },
  {
    question: "Is it safe to paste real record IDs into this tool?",
    answer:
      "Yes. The page is a static site with no backend: the conversion runs entirely in your browser tab and no network request carries your data. Record IDs are not secrets on their own, but bulk exports can reveal org structure and volumes — nothing here ever leaves your machine, and you can verify it in the browser's Network panel.",
  },
  {
    question: "Should I store 15 or 18 character IDs in my external system?",
    answer:
      "Store the 18-character form in any system that might compare Ids case-insensitively — Excel exports, SQL databases with case-insensitive collation, marketing platforms. Keep the 15-character form only where you control case-sensitive comparisons. If the system might ever round-trip data through a case-transforming layer, 18 characters is the safe default.",
  },
];

export function buildIdConverterSections(): IdConverterSection[] {
  return SECTIONS;
}
