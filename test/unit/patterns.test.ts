import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { buildImportPayload, parseIngStatement } from "@/lib/import/ing";
import { d5Type, derivePatterns, median } from "@/lib/patterns/derive";
import { merchantKey, normalizeMerchant, rawMerchant } from "@/lib/patterns/merchant";
import type { PatternSource } from "@/types";

// Oracle: test/fixtures/ing/expected.json (F-02). The oracle's keys are hand-authored slugs, so the contract is the
// partition of rows (sets of bankTxId) plus per-group aggregates — never key strings.
const FIXTURES = new URL("../fixtures/ing/", import.meta.url);
const MAIN = "Lista_transakcji_nr_0000123456_010926.csv";
const MAIN_ACCOUNT = "11111100000000000000000001";

interface ExpectedRow {
  file: string;
  bankTxId: string;
  imported: boolean;
  rawMerchant: string | null;
  pattern: string | null;
}
interface ExpectedPattern {
  key: string;
  type: "fixed" | "frequent";
  resolvedBy: string;
  occurrences: number;
  sumMinor: number;
  medianMinor: number;
}
interface Expected {
  files: Record<string, { imported: { count: number; sumMinor: number } }>;
  rows: ExpectedRow[];
  patterns: ExpectedPattern[];
}

const expected = JSON.parse(readFileSync(new URL("expected.json", FIXTURES), "utf8")) as Expected;

function fixtureSources(): PatternSource[] {
  const result = parseIngStatement(new Uint8Array(readFileSync(new URL(MAIN, FIXTURES))));
  if (!result.ok) throw new Error(result.error);
  return buildImportPayload(result.statement, MAIN_ACCOUNT).transactions.map((t) => ({
    id: t.bankTxId,
    amountMinor: t.amountMinor,
    counterparty: t.counterparty,
    title: t.title,
  }));
}

// Expected S-03 partition: oracle groups, except user merges (S-05) split back by raw merchant.
function expectedGroups(): { pattern: ExpectedPattern; ids: string[] }[] {
  const byPattern = new Map(expected.patterns.map((p) => [p.key, p]));
  const groups = new Map<string, { pattern: ExpectedPattern; ids: string[] }>();
  for (const row of expected.rows.filter((r) => r.file === MAIN && r.imported)) {
    const pattern = byPattern.get(row.pattern ?? "");
    if (!pattern) throw new Error(`row ${row.bankTxId} has no pattern`);
    const id = pattern.resolvedBy === "user-merge" ? `${pattern.key}|${row.rawMerchant ?? ""}` : pattern.key;
    const group = groups.get(id) ?? { pattern, ids: [] };
    group.ids.push(row.bankTxId);
    groups.set(id, group);
  }
  return [...groups.values()].map((g) => ({ ...g, ids: g.ids.sort() }));
}

describe("derivePatterns — F-02 oracle", () => {
  const sources = fixtureSources();
  const patterns = derivePatterns(sources);
  const groups = expectedGroups();

  it("fixture partition", () => {
    expect(patterns).toHaveLength(31);
    expect(groups).toHaveLength(31);
    const expectedSets = groups.map((g) => g.ids.join(","));
    for (const p of patterns) expect(expectedSets).toContain(p.transactionIds.join(","));
    const all = patterns.flatMap((p) => p.transactionIds);
    expect(all).toHaveLength(206);
    expect(new Set(all).size).toBe(206);
    expect(patterns.reduce((s, p) => s + p.sumMinor, 0)).toBe(expected.files[MAIN].imported.sumMinor);
  });

  it("fixture aggregates", () => {
    const byIds = new Map(groups.map((g) => [g.ids.join(","), g.pattern]));
    for (const p of patterns) {
      const oracle = byIds.get(p.transactionIds.join(","));
      if (!oracle) throw new Error(`no oracle group for ${p.name}`);
      if (oracle.resolvedBy === "user-merge") {
        expect(p.type).toBe("frequent");
        continue;
      }
      expect([p.occurrences, p.sumMinor, p.medianMinor, p.type]).toEqual([
        oracle.occurrences,
        oracle.sumMinor,
        oracle.medianMinor,
        oracle.type,
      ]);
    }
    const sportowo = patterns.filter((p) => p.key.startsWith("sportowo"));
    expect(sportowo.map((p) => p.name).sort()).toEqual(["SPORTOWO", "sportowo.pl"]);
    expect(sportowo.map((p) => median(sourcesOf(p.transactionIds))).sort()).toEqual([12740, 15949.5]);

    const fixed = patterns.filter((p) => p.fixedAmountMinor !== null);
    expect(fixed).toHaveLength(expected.patterns.filter((p) => p.type === "fixed").length);
    expect(fixed).toHaveLength(7);
    for (const p of patterns) expect(p.fixedAmountMinor).toBe(p.type === "fixed" ? p.medianMinor : null);
    expect(patterns.find((p) => p.name === "KINOTEKA")?.fixedAmountMinor).toBe(5299);
    expect(patterns.find((p) => p.name === "MINIMARKET PRZYSTANEK")?.occurrences).toBe(8);

    function sourcesOf(ids: string[]): number[] {
      return sources.filter((s) => ids.includes(s.id)).map((s) => s.amountMinor);
    }
  });

  it("is sorted by sum descending", () => {
    const sums = patterns.map((p) => p.sumMinor);
    expect(sums).toEqual([...sums].sort((a, b) => b - a));
  });

  it("determinism", () => {
    let seed = 7;
    const shuffled = [...sources]
      .map((s) => ({ s, r: (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) }))
      .sort((a, b) => a.r - b.r)
      .map(({ s }) => s);
    expect(shuffled.map((s) => s.id)).not.toEqual(sources.map((s) => s.id));
    expect(derivePatterns(shuffled)).toEqual(patterns);
  });
});

describe("rawMerchant — rule 7 / D3", () => {
  it("takes the domain after Nr transakcji for an operator (T04)", () => {
    expect(rawMerchant("PayU S.A.", "Płatność Nr transakcji 123456789 kawa-testowa.pl")).toBe("kawa-testowa.pl");
    expect(rawMerchant("PAYPRO SA", "Zakup Nr transakcji 42 sklep https://www.bilety-przyklad.pl")).toBe(
      "https://www.bilety-przyklad.pl",
    );
  });

  it("falls back to the collapsed counterparty for an operator with an empty tail (T05)", () => {
    expect(rawMerchant("AUTOPAY  S.A. UL. PRZYKŁADOWA 9 SOPOT", "Opłata Nr transakcji 987")).toBe(
      "AUTOPAY S.A. UL. PRZYKŁADOWA 9 SOPOT",
    );
  });

  it("matches ing pay case-insensitively", () => {
    expect(rawMerchant("ing pay", "Nr transakcji 1 apteka-przyklad.pl")).toBe("apteka-przyklad.pl");
  });

  it("uses the collapsed counterparty for a non-operator", () => {
    expect(rawMerchant("KINOTEKA   SP. Z O.O.", "Nr transakcji 5 ignored.pl")).toBe("KINOTEKA SP. Z O.O.");
  });
});

describe("normalizeMerchant", () => {
  it.each([
    ["https://www.bilety-przyklad.pl/", "bilety-przyklad.pl"],
    ["www.kawa-testowa.pl", "kawa-testowa.pl"],
    ["DROGERIA LAWENDA UL. KWIATOWA 14 KRAKÓW", "DROGERIA LAWENDA"],
    ["SPORTOWO SP. Z O.O. ul. Biegowa 7 Gdynia", "SPORTOWO"],
    ["MINIMARKET PRZYSTANEK 1187 AL. ŚWIERKOWA 5 KRAKÓW", "MINIMARKET PRZYSTANEK"],
    ["KINOTEKA SP. Z O.O. UL. EKRANOWA 21 WARSZAWA", "KINOTEKA"],
    ["FIRMA SP. J.", "FIRMA"],
    ["FIRMA SP.K.", "FIRMA"],
    ["FIRMA S.C. JAN I ANNA", "FIRMA"],
    ["AUTOPAY S.A. UL. PRZYKŁADOWA 9 SOPOT", "AUTOPAY"],
    ["FIRMA SA", "FIRMA"],
    ["PAYPAL EUROPE S.A.R.L. ET CIE S.C.A LUXEMBOURG", "PAYPAL EUROPE"],
    ["MINIMARKET PRZYSTANEK 0412", "MINIMARKET PRZYSTANEK"],
    ["PIEKARNIA KŁOSEK PIEKARNIA KŁOSEK ŁÓDŹ", "PIEKARNIA KŁOSEK ŁÓDŹ"],
    ["  ADAM    TESTOWY  ", "ADAM TESTOWY"],
    ["BAR 12 KRAKÓW", "BAR 12 KRAKÓW"],
  ])("%s → %s", (raw, name) => {
    expect(normalizeMerchant(raw)).toBe(name);
  });

  it("falls back to the collapsed raw when every token is dropped", () => {
    expect(normalizeMerchant("1234")).toBe("1234");
  });

  it.each([
    [
      "PRZYKŁADOWA FIRMA JAN PRZYKŁADOWY UL. TESTOWA 1A 00-001 PRZYKŁADOWO",
      "JAN PRZYKŁADOWY UL. TESTOWA 1A 00-001 PRZYKŁADOWO",
    ],
    ["sportowo.pl UL. BIEGOWA 7 GDYNIA", "SPORTOWO SP. Z O.O. ul. Biegowa 7 Gdynia"],
    ["KINO ŚWIATŁO UL. FILMOWA 2 KRAKÓW", "KINOTEKA SP. Z O.O. UL. EKRANOWA 21 WARSZAWA"],
    ["URZĄD SKARBOWY W PRZYKŁADOWIE", "ZAKŁAD UBEZPIECZEŃ SPOŁECZNYCH"],
  ])("does not merge %s with %s", (a, b) => {
    expect(merchantKey(a)).not.toBe(merchantKey(b));
  });
});

describe("D5", () => {
  it("is fixed exactly at the tolerance and frequent one grosz over", () => {
    // median 20000 → tolerance 3000
    expect(d5Type([17000, 20000, 23000])).toBe("fixed");
    expect(d5Type([16999, 20000, 23000])).toBe("frequent");
  });

  it("uses the 10 zł floor for a small median", () => {
    // median 2000 → 15% = 300, floor 1000
    expect(d5Type([1000, 2000, 3000])).toBe("fixed");
    expect(d5Type([999, 2000, 3000])).toBe("frequent");
  });

  it("takes the mean of the middle two for an even count", () => {
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });

  it("treats a single occurrence as fixed", () => {
    expect(d5Type([12345])).toBe("fixed");
  });
});
