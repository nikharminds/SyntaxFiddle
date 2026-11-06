/**
 * Salesforce 15 ↔ 18 character Id conversion — pure, client-side, testable.
 *
 * The 15-character form is base62 and case-sensitive; the 18-character form
 * appends three case-safe check characters so case-insensitive systems
 * (Excel, VLOOKUP, many data warehouses) cannot collapse distinct records.
 */

export const CHECK_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ012345";

const ID_15 = /^[a-zA-Z0-9]{15}$/;
const ID_18 = /^[a-zA-Z0-9]{18}$/;

/**
 * Well-known standard-object key prefixes (first three characters of an Id).
 * Custom-object records and many org-specific objects use per-org prefixes
 * that cannot be listed statically — the UI labels those as org-specific.
 */
export const OBJECT_PREFIXES: Record<string, string> = {
  "001": "Account",
  "002": "Note",
  "003": "Contact",
  "005": "User",
  "006": "Opportunity",
  "00D": "Organization",
  "00G": "Group / Queue",
  "00N": "Custom Field (metadata)",
  "00O": "Report",
  "00P": "Attachment",
  "00Q": "Lead",
  "00T": "Task",
  "00U": "Event",
  "00X": "Email Template",
  "00e": "Profile",
  "00l": "Folder",
  "012": "Record Type",
  "015": "Document",
  "01I": "Custom Object (metadata)",
  "01Z": "Dashboard",
  "01p": "Apex Class",
  "01q": "Apex Trigger",
  "01s": "Price Book (Pricebook2)",
  "01t": "Product (Product2)",
  "02i": "Asset",
  "02s": "Email Message",
  "05D": "Content Document",
  "066": "Visualforce Page",
  "069": "Content Version",
  "0D9": "Feed Item",
  "0PS": "Permission Set",
  "500": "Case",
  "701": "Campaign",
  "800": "Contract",
  "801": "Order",
};

export interface ConvertIdResult {
  input: string;
  valid: boolean;
  format: 15 | 18 | null;
  /** Case-safe 18-character Id (the input itself when already 18). */
  id18: string | null;
  /** Classic 15-character Id (first 15 characters). */
  id15: string | null;
  /** For 18-char inputs: whether the trailing suffix matches the case-parity checksum. */
  checksumValid: boolean | null;
  /** Object key prefix (first 3 characters) when the input is a plausible Id. */
  prefix: string | null;
  /** Standard object name when the prefix is well-known, else null. */
  objectName: string | null;
  error?: string;
}

/** Computes the three case-parity check characters for a 15-character Id. */
export function computeCheckSuffix(id15: string): string {
  let suffix = "";
  for (let chunk = 0; chunk < 3; chunk += 1) {
    let bits = 0;
    for (let i = 0; i < 5; i += 1) {
      const char = id15[chunk * 5 + i] ?? "";
      if (char >= "A" && char <= "Z") {
        bits |= 1 << i;
      }
    }
    suffix += CHECK_ALPHABET[bits] ?? "";
  }
  return suffix;
}

export function to18CharId(id: string): string | null {
  const trimmed = id.trim();
  if (ID_18.test(trimmed)) return trimmed;
  if (!ID_15.test(trimmed)) return null;
  return trimmed + computeCheckSuffix(trimmed);
}

export function to15CharId(id: string): string | null {
  const trimmed = id.trim();
  if (!ID_15.test(trimmed) && !ID_18.test(trimmed)) return null;
  return trimmed.slice(0, 15);
}

export function convertId(input: string): ConvertIdResult {
  const trimmed = input.trim();
  if (ID_15.test(trimmed)) {
    const prefix = trimmed.slice(0, 3);
    return {
      input: trimmed,
      valid: true,
      format: 15,
      id15: trimmed,
      id18: trimmed + computeCheckSuffix(trimmed),
      checksumValid: null,
      prefix,
      objectName: OBJECT_PREFIXES[prefix] ?? null,
    };
  }
  if (ID_18.test(trimmed)) {
    const id15 = trimmed.slice(0, 15);
    const prefix = trimmed.slice(0, 3);
    return {
      input: trimmed,
      valid: true,
      format: 18,
      id15,
      id18: trimmed,
      checksumValid: computeCheckSuffix(id15) === trimmed.slice(15),
      prefix,
      objectName: OBJECT_PREFIXES[prefix] ?? null,
    };
  }

  const error =
    trimmed.length === 0
      ? "Enter a Salesforce Id."
      : /^[a-zA-Z0-9]+$/.test(trimmed)
        ? `A Salesforce Id is 15 or 18 alphanumeric characters — got ${trimmed.length}.`
        : "A Salesforce Id contains only letters and digits — check for spaces or punctuation.";
  return {
    input: trimmed,
    valid: false,
    format: null,
    id15: null,
    id18: null,
    checksumValid: null,
    prefix: null,
    objectName: null,
    error,
  };
}

/** Splits a bulk paste (newlines, commas, semicolons, spaces) into converted rows. */
export function convertIds(input: string): ConvertIdResult[] {
  return input
    .split(/[\s,;]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
    .map(convertId);
}
