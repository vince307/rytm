import { describe, expect, it } from "vitest";
import content from "../../design/rytm-os/react-kit/docs/content.json";
import { kitEn } from "@/content/en/kit";
import { extraEn } from "@/content/en/extra";
import { copyExtraPl, getCopy, getMonths } from "@/content/copy";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

/** Proper names and the currency that legitimately keep Polish letters in EN. */
const ALLOWED_PL_TOKENS = ["zł", "ING Bank Śląski", "Język"];
const PL_DIACRITICS = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;

function leaves(node: Json, path = ""): [string, string | number | boolean | null][] {
  if (Array.isArray(node)) return node.flatMap((v, i) => leaves(v, `${path}[${i}]`));
  if (node !== null && typeof node === "object")
    return Object.entries(node).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  return [[path, node]];
}

/** Array lengths keyed by path, so a shortened EN array shows up even if the leaf-path set were to coincide. */
function arrayLengths(node: Json, path = ""): [string, number][] {
  if (Array.isArray(node)) return [[path, node.length], ...node.flatMap((v, i) => arrayLengths(v, `${path}[${i}]`))];
  if (node !== null && typeof node === "object")
    return Object.entries(node).flatMap(([k, v]) => arrayLengths(v, path ? `${path}.${k}` : k));
  return [];
}

const pl = content as unknown as Json;
const en = kitEn as unknown as Json;
const plLeaves = new Map(leaves(pl));
const enLeaves = new Map(leaves(en));
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("EN kit parity with content.json", () => {
  it("has the same leaf-path set", () => {
    expect([...enLeaves.keys()].sort()).toEqual([...plLeaves.keys()].sort());
  });

  it("has the same length for every array", () => {
    expect(arrayLengths(en)).toEqual(arrayLengths(pl));
  });

  it("keeps the same placeholder set per string leaf", () => {
    const mismatched = [...plLeaves]
      .filter(([, v]) => typeof v === "string")
      .filter(([p, v]) => {
        const e = enLeaves.get(p);
        return typeof e !== "string" || placeholders(e).join() !== placeholders(v as string).join();
      })
      .map(([p]) => p);
    expect(mismatched).toEqual([]);
  });

  it("keeps numeric leaves equal", () => {
    const numeric = [...plLeaves].filter(([, v]) => typeof v === "number");
    expect(numeric.length).toBeGreaterThan(0);
    for (const [p, v] of numeric) expect(enLeaves.get(p), p).toBe(v);
  });

  it("has no Polish diacritics in EN strings (allow-list: currency, bank name)", () => {
    const offenders = [...enLeaves]
      .filter(([, v]) => typeof v === "string")
      .filter(([, v]) => {
        let s = v as string;
        for (const token of ALLOWED_PL_TOKENS) s = s.split(token).join("");
        return PL_DIACRITICS.test(s);
      })
      .map(([p]) => p);
    expect(offenders).toEqual([]);
  });

  it("carries 12 English month names under the Polish keys", () => {
    const plKeys = Object.keys(content.patternDetail.monthNames);
    expect(Object.keys(kitEn.patternDetail.monthNames)).toEqual(plKeys);
    const values = Object.values(kitEn.patternDetail.monthNames);
    expect(values).toHaveLength(12);
    expect(values).toEqual([
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]);
  });

  it("says DELETE wherever PL says USUŃ", () => {
    const delWords = [...plLeaves].filter(([, v]) => typeof v === "string" && v.includes("USUŃ"));
    expect(delWords.map(([p]) => p).sort()).toEqual([
      "settings.confirmation",
      "settings.deleteConfirm",
      "settings.deleteDisabledHelp",
    ]);
    for (const [p] of delWords) {
      const e = enLeaves.get(p);
      expect(e, p).toEqual(expect.stringContaining("DELETE"));
      expect(e, p).not.toEqual(expect.stringContaining("USUŃ"));
    }
  });

  it("uses [one, other, other] for every forms tuple", () => {
    const tuples = [
      kitEn.patterns.countForms,
      kitEn.patternActions.mergeForms,
      kitEn.fixedCosts.itemForms,
      kitEn.fixedCosts.unchangedForms,
      kitEn.importFlow.debitForms,
    ];
    for (const t of tuples) {
      expect(t).toHaveLength(3);
      expect(t[1]).toBe(t[2]);
      expect(t[0]).not.toBe(t[1]);
    }
  });
});

describe("EN extra parity with copyExtraPl", () => {
  const plX = new Map(leaves(copyExtraPl as unknown as Json));
  const enX = new Map(leaves(extraEn));

  it("has the same leaf-path set and array lengths", () => {
    expect([...enX.keys()].sort()).toEqual([...plX.keys()].sort());
    expect(arrayLengths(extraEn as unknown as Json)).toEqual(arrayLengths(copyExtraPl as unknown as Json));
  });

  it("keeps the same placeholder set per string leaf", () => {
    const mismatched = [...plX]
      .filter(([, v]) => typeof v === "string")
      .filter(([p, v]) => {
        const e = enX.get(p);
        return typeof e !== "string" || placeholders(e).join() !== placeholders(v as string).join();
      })
      .map(([p]) => p);
    expect(mismatched).toEqual([]);
  });

  it("has no Polish diacritics in EN strings (allow-list: currency)", () => {
    const offenders = [...enX]
      .filter(([, v]) => typeof v === "string")
      .filter(([, v]) => {
        let s = v as string;
        for (const token of ALLOWED_PL_TOKENS) s = s.split(token).join("");
        return PL_DIACRITICS.test(s);
      })
      .map(([p]) => p);
    expect(offenders).toEqual([]);
  });

  it("uses [one, other, other] for every forms tuple", () => {
    for (const t of [
      extraEn.home.fixedSummary.costForms,
      extraEn.imports.transactionForms,
      extraEn.imports.accountForms,
      extraEn.patterns.occurrenceForms,
    ]) {
      expect(t).toHaveLength(3);
      expect(t[1]).toBe(t[2]);
      expect(t[0]).not.toBe(t[1]);
    }
  });
});

describe("getCopy / getMonths per locale", () => {
  it("returns the EN pair for en and the PL pair for pl", () => {
    expect(getCopy("en")).toEqual({ copy: kitEn, copyExtra: extraEn });
    expect(getCopy("pl").copy).toBe(content);
    expect(getCopy("pl").copyExtra).toBe(copyExtraPl);
  });

  it("builds month lists from the locale's dictionaries", () => {
    expect(getMonths("en").genitive[4]).toBe("May");
    expect(getMonths("en").locative[0]).toBe("January");
    expect(getMonths("pl").genitive[4]).toBe("maja");
    expect(getMonths("pl").locative[0]).toBe("styczniu");
  });

  it("gives EN nominatives in English (the EN monthNames keys stay Polish)", () => {
    expect(getMonths("en").nominative[8]).toBe("September");
    expect(getMonths("pl").nominative[8]).toBe("wrzesień");
  });
});
