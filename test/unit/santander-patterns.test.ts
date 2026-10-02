import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { buildImportPayload, parseIngStatement } from "@/lib/import/ing";
import { buildSantanderPayload, parseSantanderStatement } from "@/lib/import/santander";
import { derivePatterns } from "@/lib/patterns/derive";
import { merchantKey, rawMerchant } from "@/lib/patterns/merchant";
import type { MerchantPattern, PatternSource } from "@/types";

// Oracle: test/fixtures/santander/expected.json (F-03). Mirrors patterns.test.ts's F-02 convention: the oracle's
// `pattern` keys are hand-authored slugs, so the contract is the partition of rows (sets of `lp`, as strings) plus
// per-group aggregates — never key text — except where the plan pins specific display names or cross-bank keys.
const FIXTURES = new URL("../fixtures/santander/", import.meta.url);
const MAIN = "historia_2026-08-31_61109012340001111222233334.csv";
const ACCOUNT_NAME = "Rachunek";

const ING_FIXTURES = new URL("../fixtures/ing/", import.meta.url);
const ING_MAIN = "Lista_transakcji_nr_0000123456_010926.csv";
const ING_MAIN_ACCOUNT = "11111100000000000000000001";

interface ExpectedRow {
  file: string;
  lp: number;
  occurredOn: string;
  amountMinor: number;
  traps: string[];
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
interface CrossBankEntry {
  pattern: string;
  type: "fixed" | "frequent";
  oracle: string;
  traps: string[];
}
interface Expected {
  files: Record<string, { account: string; imported: { count: number; sumMinor: number } }>;
  rows: ExpectedRow[];
  patterns: ExpectedPattern[];
  crossBank: CrossBankEntry[];
}

interface IngExpectedPattern {
  key: string;
  rawMerchants: string[];
}
interface IngExpectedRow {
  file: string;
  bankTxId: string;
  imported: boolean;
  pattern: string | null;
}
interface IngExpected {
  rows: IngExpectedRow[];
  patterns: IngExpectedPattern[];
}

const expected = JSON.parse(readFileSync(new URL("expected.json", FIXTURES), "utf8")) as Expected;
const ingExpected = JSON.parse(readFileSync(new URL("expected.json", ING_FIXTURES), "utf8")) as IngExpected;
const bytesOf = (name: string) => new Uint8Array(readFileSync(new URL(name, FIXTURES)));

function fixtureSources(): PatternSource[] {
  const result = parseSantanderStatement(bytesOf(MAIN), { accountName: ACCOUNT_NAME });
  if (!result.ok) throw new Error(result.error);
  const payload = buildSantanderPayload(result.statement, expected.files[MAIN].account);
  const imported = expected.rows.filter((r) => r.file === MAIN && r.imported);
  return payload.transactions.map((t, i) => ({
    // Zipped with the oracle's imported rows in file order (both filter the same way: debits of this account, in
    // file order) — the id itself is never in the payload (rule 7: Santander rows carry no bankTxId).
    id: String(imported[i].lp),
    amountMinor: t.amountMinor,
    counterparty: t.counterparty,
    title: t.title,
    occurredOn: t.occurredOn,
  }));
}

function ingFixtureSources(): PatternSource[] {
  const bytes = readFileSync(new URL(ING_MAIN, ING_FIXTURES));
  const result = parseIngStatement(new Uint8Array(bytes));
  if (!result.ok) throw new Error(result.error);
  return buildImportPayload(result.statement, ING_MAIN_ACCOUNT).transactions.map((t) => ({
    id: `ing-${t.bankTxId ?? ""}`,
    amountMinor: t.amountMinor,
    counterparty: t.counterparty,
    title: t.title,
    occurredOn: t.occurredOn,
  }));
}

// Expected S-11 Phase 2 partition: oracle groups, except the user-merge group (`marka`, ST03) split back by raw
// merchant — `derivePatterns` is never given decisions here, so it never merges them either (mirrors
// patterns.test.ts's `expectedGroups` for the ING F-02 oracle).
function expectedGroups(): { pattern: ExpectedPattern; ids: string[] }[] {
  const byPattern = new Map(expected.patterns.map((p) => [p.key, p]));
  const groups = new Map<string, { pattern: ExpectedPattern; ids: string[] }>();
  for (const row of expected.rows.filter((r) => r.file === MAIN && r.imported)) {
    const pattern = byPattern.get(row.pattern ?? "");
    if (!pattern) throw new Error(`row lp=${row.lp} has no pattern`);
    const id = pattern.resolvedBy === "user-merge" ? `${pattern.key}|${row.rawMerchant ?? ""}` : pattern.key;
    const group = groups.get(id) ?? { pattern, ids: [] };
    group.ids.push(String(row.lp));
    groups.set(id, group);
  }
  return [...groups.values()].map((g) => ({ ...g, ids: g.ids.sort() }));
}

function byName(patterns: readonly MerchantPattern[], name: string): MerchantPattern | undefined {
  return patterns.find((p) => p.name === name);
}

describe("derivePatterns — Santander F-03 oracle (S-11 Phase 2)", () => {
  const sources = fixtureSources();
  const patterns = derivePatterns(sources);
  const groups = expectedGroups();
  const imported = expected.rows.filter((r) => r.file === MAIN && r.imported);

  it("zips the payload transactions with the oracle's imported rows in file order", () => {
    expect(sources).toHaveLength(imported.length);
    sources.forEach((s, i) => {
      expect(s.occurredOn).toBe(imported[i].occurredOn);
      expect(s.amountMinor).toBe(Math.abs(imported[i].amountMinor));
      expect(s.id).toBe(String(imported[i].lp));
    });
  });

  it("fixture partition: 35 patterns equal to the 35 split-back oracle groups, 184 ids, sum 1342109", () => {
    expect(patterns).toHaveLength(35);
    expect(groups).toHaveLength(35);
    const expectedSets = groups.map((g) => g.ids.join(","));
    for (const p of patterns) expect(expectedSets).toContain(p.transactionIds.join(","));
    const all = patterns.flatMap((p) => p.transactionIds);
    expect(all).toHaveLength(184);
    expect(new Set(all).size).toBe(184);
    expect(patterns.reduce((s, p) => s + p.sumMinor, 0)).toBe(1342109);
    expect(expected.files[MAIN].imported).toEqual({ count: 184, sumMinor: 1342109 });
  });

  it("aggregates of every non-user-merge group equal the oracle", () => {
    const byIds = new Map(groups.map((g) => [g.ids.join(","), g.pattern]));
    for (const p of patterns) {
      const oracle = byIds.get(p.transactionIds.join(","));
      if (!oracle) throw new Error(`no oracle group for ${p.name}`);
      if (oracle.resolvedBy === "user-merge") continue;
      expect([p.occurrences, p.sumMinor, p.medianMinor, p.type]).toEqual([
        oracle.occurrences,
        oracle.sumMinor,
        oracle.medianMinor,
        oracle.type,
      ]);
    }
  });

  it("gives the expected display names: SIEC PRZYKLAD, Bankomat, PUB POD KOGUTEM, KINO NOVA SALA DUZA", () => {
    expect(byName(patterns, "SIEC PRZYKLAD")).toBeDefined();
    expect(byName(patterns, "Bankomat")).toBeDefined();
    expect(byName(patterns, "PUB POD KOGUTEM")).toBeDefined();
    expect(byName(patterns, "KINO NOVA SALA DUZA")).toBeDefined();
  });
});

describe("cross-bank — ST10 pizzeria-trzy-sery (S-11 Phase 2 oracle, crossBank)", () => {
  const sources = fixtureSources();
  const patterns = derivePatterns(sources);

  const ingPizzeria = ingExpected.patterns.find((p) => p.key === "pizzeria-trzy-sery");
  if (!ingPizzeria) throw new Error("ING oracle no longer has a pizzeria-trzy-sery pattern");
  const crossBankKey = merchantKey(rawMerchant(ingPizzeria.rawMerchants[0], ""));

  it("the ING oracle's raw merchant keys to 'pizzeria trzy sery'", () => {
    expect(crossBankKey).toBe("pizzeria trzy sery");
  });

  it("every ST10 row's derived key equals the ING oracle's pizzeria-trzy-sery key", () => {
    const st10Ids = expected.rows
      .filter((r) => r.file === MAIN && r.traps.includes("ST10"))
      .map((r) => String(r.lp))
      .sort();
    expect(st10Ids.length).toBeGreaterThan(0);
    const group = patterns.find((p) => [...p.transactionIds].sort().join(",") === st10Ids.join(","));
    if (!group) throw new Error("no derived pattern matches the ST10 id set");
    expect(group.key).toBe(crossBankKey);
  });
});

describe("cross-bank — derivePatterns over ING main + Santander main (crossBank oracle)", () => {
  it("yields one pizzeria-trzy-sery pattern holding every matching ING and Santander id", () => {
    const santanderImported = expected.rows.filter((r) => r.file === MAIN && r.imported);
    const santanderResult = parseSantanderStatement(bytesOf(MAIN), { accountName: ACCOUNT_NAME });
    if (!santanderResult.ok) throw new Error(santanderResult.error);
    const santanderSources: PatternSource[] = buildSantanderPayload(
      santanderResult.statement,
      expected.files[MAIN].account,
    ).transactions.map((t, i) => ({
      id: `st-${santanderImported[i].lp}`,
      amountMinor: t.amountMinor,
      counterparty: t.counterparty,
      title: t.title,
      occurredOn: t.occurredOn,
    }));

    const combined = derivePatterns([...ingFixtureSources(), ...santanderSources]);
    const group = combined.find((p) => p.key === "pizzeria trzy sery");
    if (!group) throw new Error("no combined cross-bank pattern for pizzeria trzy sery");

    const ingPizzeriaIds = ingExpected.rows
      .filter((r) => r.file === ING_MAIN && r.imported && r.pattern === "pizzeria-trzy-sery")
      .map((r) => `ing-${r.bankTxId}`);
    const santanderPizzeriaIds = expected.rows
      .filter((r) => r.file === MAIN && r.imported && r.pattern === "pizzeria-trzy-sery")
      .map((r) => `st-${r.lp}`);
    expect(ingPizzeriaIds.length).toBeGreaterThan(0);
    expect(santanderPizzeriaIds.length).toBeGreaterThan(0);

    expect([...group.transactionIds].sort()).toEqual([...ingPizzeriaIds, ...santanderPizzeriaIds].sort());
    expect(group.name).toBe("PIZZERIA TRZY SERY");
    expect(group.type).toBe(expected.crossBank[0].type);
  });
});
