import { describe, expect, it } from "vitest";
import content from "../../design/rytm-os/react-kit/docs/content.json";
import { kitEn } from "@/content/en/kit";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

/** Proper names and the currency that legitimately keep Polish letters in EN. */
const ALLOWED_PL_TOKENS = ["zł", "ING Bank Śląski"];
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
