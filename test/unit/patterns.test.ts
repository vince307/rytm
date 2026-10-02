import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { buildImportPayload, parseIngStatement } from "@/lib/import/ing";
import { d5Type, derivePatterns, median } from "@/lib/patterns/derive";
import { collectPages, MAX_PAGES } from "@/lib/patterns/load";
import { merchantKey, normalizeMerchant, rawMerchant } from "@/lib/patterns/merchant";
import type { MerchantPattern, PatternDecision, PatternSource } from "@/types";

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
    // ING always carries a bankTxId (S-10 widened the type to string | null only for Santander, rule 7).
    id: t.bankTxId ?? "",
    amountMinor: t.amountMinor,
    counterparty: t.counterparty,
    title: t.title,
    occurredOn: t.occurredOn,
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

// S-05: the oracle's `resolvedBy` groups (above) are already what a *decided* partition should look like — this
// variant does not split `user-merge` back apart, so it is the acceptance shape once the decisions are applied.
function oracleGroups(): { pattern: ExpectedPattern; ids: string[] }[] {
  const byPattern = new Map(expected.patterns.map((p) => [p.key, p]));
  const groups = new Map<string, { pattern: ExpectedPattern; ids: string[] }>();
  for (const row of expected.rows.filter((r) => r.file === MAIN && r.imported)) {
    const pattern = byPattern.get(row.pattern ?? "");
    if (!pattern) throw new Error(`row ${row.bankTxId} has no pattern`);
    const group = groups.get(pattern.key) ?? { pattern, ids: [] };
    group.ids.push(row.bankTxId);
    groups.set(pattern.key, group);
  }
  return [...groups.values()].map((g) => ({ ...g, ids: g.ids.sort() }));
}

function byKey(patterns: readonly MerchantPattern[], key: string): MerchantPattern {
  const found = patterns.find((p) => p.key === key);
  if (!found) throw new Error(`no pattern for key "${key}"`);
  return found;
}

function oraclePattern(key: string): ExpectedPattern {
  const found = expected.patterns.find((p) => p.key === key);
  if (!found) throw new Error(`no oracle pattern "${key}"`);
  return found;
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

describe("derivePatterns — F-02 oracle with the fixture decisions (S-05)", () => {
  const sources = fixtureSources();
  const undecided = derivePatterns(sources);

  // Grounded in the fixture's own recorded raw merchants — never a hardcoded slug (the real `merchantKey` is
  // whatever key `derivePatterns` gives that group, per the plan).
  const sportowoRaws = [
    ...new Set(
      expected.rows
        .filter((r) => r.file === MAIN && r.imported && r.pattern === "sportowo")
        .map((r) => r.rawMerchant ?? ""),
    ),
  ];
  const sportowoKeys = sportowoRaws.map((raw) => merchantKey(raw));
  const target = sportowoKeys.find((k) => k !== "sportowo.pl");
  const source = sportowoKeys.find((k) => k === "sportowo.pl");
  if (!target || !source) throw new Error("fixture no longer has both sportowo raw variants");

  const excludeRaw = expected.rows.find(
    (r) => r.file === MAIN && r.imported && r.pattern === "przelew-konto-osobiste",
  )?.rawMerchant;
  if (!excludeRaw) throw new Error("fixture no longer has the przelew-konto-osobiste group");
  const excludeKey = merchantKey(excludeRaw);

  const decisions = new Map<string, PatternDecision>([
    [source, { mergedInto: target, excluded: false, pinnedType: null, displayName: null }],
    [excludeKey, { mergedInto: null, excluded: true, pinnedType: null, displayName: null }],
  ]);

  const patterns = derivePatterns(sources, decisions);
  const oracle = oracleGroups();

  it("the partition equals the oracle's 30 groups", () => {
    expect(patterns).toHaveLength(30);
    expect(oracle).toHaveLength(30);
    const expectedSets = oracle.map((g) => g.ids.join(","));
    for (const p of patterns) expect(expectedSets).toContain(p.transactionIds.join(","));
    const all = patterns.flatMap((p) => p.transactionIds);
    expect(new Set(all).size).toBe(206);
  });

  it("the merged sportowo pattern sums its (undecided) components and lists the absorbed variant", () => {
    const merged = byKey(patterns, target);
    const components = undecided.filter((p) => p.key === target || p.key === source);
    expect(components).toHaveLength(2);
    const oracleSportowo = oraclePattern("sportowo");
    expect(merged.occurrences).toBe(oracleSportowo.occurrences);
    expect(merged.occurrences).toBe(components.reduce((s, p) => s + p.occurrences, 0));
    expect(merged.sumMinor).toBe(oracleSportowo.sumMinor);
    expect(merged.sumMinor).toBe(components.reduce((s, p) => s + p.sumMinor, 0));
    expect(merged.merged).toEqual([{ key: source, name: "sportowo.pl" }]);
  });

  it("the excluded group is marked excluded and keeps the oracle's aggregates", () => {
    const excluded = byKey(patterns, excludeKey);
    const oracleExcluded = oraclePattern("przelew-konto-osobiste");
    expect(excluded.excluded).toBe(true);
    expect(excluded.occurrences).toBe(oracleExcluded.occurrences);
    expect(excluded.sumMinor).toBe(oracleExcluded.sumMinor);
    expect(excluded.merged).toEqual([]);
  });

  it("every other (undecided) group is unaffected", () => {
    for (const p of patterns) {
      if (p.key === target || p.key === excludeKey) continue;
      expect(p.excluded).toBe(false);
      expect(p.merged).toEqual([]);
    }
  });

  it("determinism under a shuffle", () => {
    let seed = 13;
    const shuffled = [...sources]
      .map((s) => ({ s, r: (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) }))
      .sort((a, b) => a.r - b.r)
      .map(({ s }) => s);
    expect(shuffled.map((s) => s.id)).not.toEqual(sources.map((s) => s.id));
    expect(derivePatterns(shuffled, decisions)).toEqual(patterns);
  });
});

// S-11 Phase 1 safety net: pins ING key TEXT before the Santander step is added to `rawMerchant`. The F-02
// partition test above only sees the grouping (sets of bankTxId), never the key string, so a consistent rename of
// every ING key would stay green there while silently orphaning saved `pattern_thresholds` / `pattern_decisions`
// rows. `ING_KEYS` is generated — not hand-typed — from `merchantKey(rawMerchant(counterparty, title))` run on this
// branch before Phase 2 (= `main` 9f63fd9), one entry per distinct oracle `rawMerchant` of the ING main fixture.
describe("ING merchant keys — text pin (S-11)", () => {
  const ING_KEYS: Record<string, string> = {
    "STACJA PALIW DROGOWSKAZ UL. DROGOWA 1 KRAKÓW": "stacja paliw drogowskaz",
    "RESTAURACJA POD PRZYKŁADEM UL. SMACZNA 2 WROCŁAW": "restauracja pod przykładem",
    "URZĄD SKARBOWY W PRZYKŁADOWIE": "urząd skarbowy w przykładowie",
    "PIZZERIA TRZY SERY UL. MAKOWA 9 KRAKÓW": "pizzeria trzy sery",
    "SKLEP ZOOLOGICZNY PAZUREK UL. PSIA 6 KRAKÓW": "sklep zoologiczny pazurek",
    "KINOTEKA SP. Z O.O. UL. EKRANOWA 21 WARSZAWA": "kinoteka",
    "MINIMARKET PRZYSTANEK 1187 AL. ŚWIERKOWA 5 KRAKÓW": "minimarket przystanek",
    "KINO ŚWIATŁO UL. FILMOWA 2 KRAKÓW": "kino światło",
    "JAN PRZYKŁADOWY UL. TESTOWA 1A 00-001 PRZYKŁADOWO": "jan przykładowy",
    "ZAKŁAD UBEZPIECZEŃ SPOŁECZNYCH": "zakład ubezpieczeń społecznych",
    "MUZYKALNIA SP. Z O.O. UL. NUTOWA 4 WARSZAWA": "muzykalnia",
    "ADAM TESTOWY": "adam testowy",
    "SIŁOWNIA RUCH UL. MOCNA 10 KRAKÓW": "siłownia ruch",
    "PAYPAL EUROPE S.A.R.L. ET CIE S.C.A LUXEMBOURG": "paypal europe",
    "kawa-testowa.pl": "kawa-testowa.pl",
    "ALLEGRO SP. Z O.O. UL. PRZYKŁADOWA 5 POZNAŃ": "allegro",
    "PIEKARNIA KŁOSEK PIEKARNIA KŁOSEK ŁÓDŹ": "piekarnia kłosek łódź",
    "PIOTR FIKCYJNY": "piotr fikcyjny",
    "SPORTOWO SP. Z O.O. ul. Biegowa 7 Gdynia": "sportowo",
    "ksiegarnia-przyklad.pl": "ksiegarnia-przyklad.pl",
    "KAWIARNIA FILIŻANKA UL. RYNEK 3 KRAKÓW": "kawiarnia filiżanka",
    "MINIMARKET PRZYSTANEK 0412 UL. TORUŃSKA 12 KRAKÓW": "minimarket przystanek",
    "RACHUNEK VAT PRZYKŁADOWA FIRMA": "rachunek vat przykładowa firma",
    "apteka-przyklad.pl": "apteka-przyklad.pl",
    "PRZYKŁADOWA FIRMA JAN PRZYKŁADOWY UL. TESTOWA 1A 00-001 PRZYKŁADOWO": "przykładowa firma jan przykładowy",
    "MARIA PRZYKŁADOWA": "maria przykładowa",
    "sportowo.pl UL. BIEGOWA 7 GDYNIA": "sportowo.pl",
    'PHU "PRZYKŁAD" JAN TESTOWY UL. LEŚNA 3 PRZYKŁADOWO': 'phu "przykład" jan testowy',
    "https://www.bilety-przyklad.pl": "bilety-przyklad.pl",
    "DROGERIA LAWENDA UL. KWIATOWA 14 KRAKÓW": "drogeria lawenda",
    "AUTOPAY S.A. UL. PRZYKŁADOWA 9 SOPOT": "autopay",
    "kurs-przyklad.pl": "kurs-przyklad.pl",
  };

  it("covers every distinct oracle raw merchant exactly once (no missing, no extra)", () => {
    const distinctRaws = new Set(
      expected.rows
        .filter((r) => r.file === MAIN && r.imported)
        .map((r) => r.rawMerchant)
        .filter((raw): raw is string => raw != null),
    );
    expect(Object.keys(ING_KEYS).sort()).toEqual([...distinctRaws].sort());
  });

  it("merchantKey(rawMerchant(counterparty, title)) matches the pin for every imported row", () => {
    const sources = fixtureSources();
    const byId = new Map(sources.map((s) => [s.id, s]));
    for (const row of expected.rows.filter((r) => r.file === MAIN && r.imported)) {
      if (row.rawMerchant == null) continue;
      const source = byId.get(row.bankTxId);
      if (!source) throw new Error(`no source for ${row.bankTxId}`);
      expect(merchantKey(rawMerchant(source.counterparty, source.title))).toBe(ING_KEYS[row.rawMerchant]);
    }
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
    // merchant-patterns follow-ups F3: a standalone `S.C.A` legal form (not inside the `S.A.R.L. ET CIE S.C.A`
    // combination above) and an `http://` (not `https://`) scheme.
    ["FIRMA S.C.A JAN I ANNA", "FIRMA"],
    ["http://www.sklep-testowy.pl/", "sklep-testowy.pl"],
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

describe("collectPages", () => {
  // A fake server that caps every response at `cap` rows, like PostgREST's max_rows, and pages by keyset (`id`
  // strictly greater than `afterId`) — not offset — so a row missing from the middle of `all` is simply skipped,
  // never duplicated or mistaken for the end.
  function cappedFetch(ids: readonly number[], cap: number, failOnCall?: number) {
    const calls: (number | null)[] = [];
    const fetchPage = (afterId: number | null) => {
      calls.push(afterId);
      if (calls.length === failOnCall) return Promise.resolve({ rows: [], error: new Error("boom") });
      const rest = afterId === null ? ids : ids.filter((id) => id > afterId);
      return Promise.resolve({ rows: rest.slice(0, cap).map((id) => ({ id })), error: null });
    };
    return { fetchPage, calls };
  }

  it("reads every row when the server caps pages below the requested size, calls carrying the last id", async () => {
    const { fetchPage, calls } = cappedFetch([1, 2, 3, 4, 5, 6, 7], 3);
    expect(await collectPages(fetchPage)).toEqual({ rows: [1, 2, 3, 4, 5, 6, 7].map((id) => ({ id })) });
    // A short page (below `cap`) is not treated as the end — the loop still asks once more and only stops on the
    // empty page that follows.
    expect(calls).toEqual([null, 3, 6, 7]);
  });

  it("fails as a whole when a later page errors", async () => {
    const { fetchPage } = cappedFetch([1, 2, 3, 4, 5, 6, 7], 3, 2);
    const result = await collectPages(fetchPage);
    expect(result).toHaveProperty("error");
    expect(result).not.toHaveProperty("rows");
  });

  it("returns an empty list after exactly one call when there are no rows", async () => {
    const { fetchPage, calls } = cappedFetch([], 3);
    expect(await collectPages(fetchPage)).toEqual({ rows: [] });
    expect(calls).toHaveLength(1);
  });

  it("does not fail when a row is deleted between pages — the gap is skipped, not duplicated or missed", async () => {
    // id 3 is gone by the time the second page (afterId 2) is fetched: a keyset read simply never returns it,
    // unlike an offset read, which would skip id 4 instead (shifted left to fill id 3's slot).
    const { fetchPage } = cappedFetch([1, 2, 4, 5], 2);
    expect(await collectPages(fetchPage)).toEqual({ rows: [1, 2, 4, 5].map((id) => ({ id })) });
  });

  it("stops with an error after MAX_PAGES when the fetch never returns an empty page", async () => {
    const fetchPage = (afterId: number | null) => Promise.resolve({ rows: [{ id: (afterId ?? 0) + 1 }], error: null });
    const result = await collectPages(fetchPage);
    expect(result).toHaveProperty("error");
    expect(result).not.toHaveProperty("rows");
  });

  it("MAX_PAGES is at least large enough to page through max_rows-sized pages of real data", () => {
    expect(MAX_PAGES).toBeGreaterThanOrEqual(1000);
  });
});
