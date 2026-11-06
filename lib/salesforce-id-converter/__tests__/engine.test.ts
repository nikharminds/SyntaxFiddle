import { describe, expect, it } from "vitest";
import {
  CHECK_ALPHABET,
  computeCheckSuffix,
  convertId,
  convertIds,
  OBJECT_PREFIXES,
  to15CharId,
  to18CharId,
} from "../engine";

describe("computeCheckSuffix", () => {
  it("returns AAA for an all-lowercase/digit Id", () => {
    expect(computeCheckSuffix("a00000000012345")).toBe("AAA");
  });

  it("maps a single trailing uppercase letter to the correct check char", () => {
    // 'A' at position 15 (local chunk position 5, bit 16) → CHECK_ALPHABET[16] = Q.
    expect(computeCheckSuffix("00000000000000A")).toBe("AAQ");
    // 'A' at position 14 (bit 8) → CHECK_ALPHABET[8] = I.
    expect(computeCheckSuffix("0000000000000A0")).toBe("AAI");
  });

  it("maps a fully uppercase chunk to the last alphabet char (5)", () => {
    expect(computeCheckSuffix("ABCDE00000000000")).toBe("5AA");
  });

  it("combines multiple uppercase bits in one chunk", () => {
    // Chunk "0QyXb": Q at position 2 (worth 2) + X at position 4 (worth 8) = 10 → K.
    expect(computeCheckSuffix("00000000000QyXb")).toBe("AAK");
  });

  it("uses exactly the A-Z0-5 alphabet", () => {
    expect(CHECK_ALPHABET).toBe("ABCDEFGHIJKLMNOPQRSTUVWXYZ012345");
  });
});

describe("to18CharId / to15CharId", () => {
  it("appends the computed suffix to a 15-char Id", () => {
    expect(to18CharId("0033000001QyXb5")).toBe("0033000001QyXb5AAF");
  });

  it("passes an 18-char Id through unchanged", () => {
    expect(to18CharId("0033000001QyXb5AAF")).toBe("0033000001QyXb5AAF");
  });

  it("truncates an 18-char Id to 15", () => {
    expect(to15CharId("0033000001QyXb5AAF")).toBe("0033000001QyXb5");
  });

  it("round-trips 15 → 18 → 15 losslessly", () => {
    for (const id of ["0013000001H3sSC", "00Q3000000m4YbE", "a0B3000000cD1u2"]) {
      expect(to15CharId(to18CharId(id)!)).toBe(id);
    }
  });

  it("returns null for invalid inputs", () => {
    expect(to18CharId("too-short")).toBeNull();
    expect(to18CharId("0033000001QyXb5!")).toBeNull();
    expect(to18CharId("0033000001QyXb5AAAAX")).toBeNull();
    expect(to15CharId("nope")).toBeNull();
  });
});

describe("convertId", () => {
  it("converts a 15-char Id and detects its object prefix", () => {
    const result = convertId("0013000001H3sSC");

    expect(result.valid).toBe(true);
    expect(result.format).toBe(15);
    expect(result.id15).toBe("0013000001H3sSC");
    expect(result.id18).toBe(to18CharId("0013000001H3sSC"));
    expect(result.prefix).toBe("001");
    expect(result.objectName).toBe("Account");
    expect(result.checksumValid).toBeNull();
  });

  it("verifies the checksum of 18-char Ids", () => {
    const valid = convertId("0033000001QyXb5AAF");
    expect(valid.valid).toBe(true);
    expect(valid.format).toBe(18);
    expect(valid.checksumValid).toBe(true);
    expect(valid.objectName).toBe("Contact");

    const corrupted = convertId("0033000001QyXb5AAG");
    expect(corrupted.valid).toBe(true);
    expect(corrupted.checksumValid).toBe(false);
  });

  it("reports unknown prefixes as org-specific", () => {
    const result = convertId("a0B3000000cD1u2");

    expect(result.valid).toBe(true);
    expect(result.prefix).toBe("a0B");
    expect(result.objectName).toBeNull();
  });

  it("rejects wrong lengths and non-alphanumeric input with clear errors", () => {
    expect(convertId("0033000001QyXb").valid).toBe(false);
    expect(convertId("0033000001QyXb").error).toMatch(/15 or 18 alphanumeric/);
    expect(convertId("0033000001QyXb5!").valid).toBe(false);
    expect(convertId("0033000001QyXb5!").error).toMatch(/letters and digits/);
    expect(convertId("   ").valid).toBe(false);
  });

  it("trims surrounding whitespace", () => {
    const result = convertId("  00530000003oJzS  \n");
    expect(result.valid).toBe(true);
    expect(result.objectName).toBe("User");
  });
});

describe("convertIds (bulk)", () => {
  it("splits on newlines, commas, and semicolons", () => {
    const results = convertIds("0013000001H3sSC,\n00530000003oJzS; 5003000000XkVpS");

    expect(results).toHaveLength(3);
    expect(results.map((row) => row.objectName)).toEqual(["Account", "User", "Case"]);
  });

  it("flags invalid rows without aborting the batch", () => {
    const results = convertIds(
      "0013000001H3sSC\nnot-a-valid-id\n5003000000XkVpS"
    );

    expect(results).toHaveLength(3);
    expect(results[0]?.valid).toBe(true);
    expect(results[1]?.valid).toBe(false);
    expect(results[2]?.valid).toBe(true);
  });

  it("returns an empty list for empty input", () => {
    expect(convertIds("")).toEqual([]);
    expect(convertIds("  \n ")).toEqual([]);
  });
});

describe("object prefix map integrity", () => {
  it("uses unique, 3-character alphanumeric prefixes", () => {
    const keys = Object.keys(OBJECT_PREFIXES);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) {
      expect(key).toMatch(/^[a-zA-Z0-9]{3}$/);
    }
  });

  it("maps every prefix to a non-empty object label", () => {
    for (const [prefix, name] of Object.entries(OBJECT_PREFIXES)) {
      expect(name.length).toBeGreaterThan(2);
    }
  });

  it("contains the famous standard-object prefixes", () => {
    expect(OBJECT_PREFIXES["001"]).toBe("Account");
    expect(OBJECT_PREFIXES["003"]).toBe("Contact");
    expect(OBJECT_PREFIXES["005"]).toBe("User");
    expect(OBJECT_PREFIXES["00Q"]).toBe("Lead");
    expect(OBJECT_PREFIXES["500"]).toBe("Case");
    expect(OBJECT_PREFIXES["701"]).toBe("Campaign");
    expect(OBJECT_PREFIXES["800"]).toBe("Contract");
  });
});
