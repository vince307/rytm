import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PatternsTable, type PatternsTableCopy } from "@/components/patterns/PatternsTable";
import { copy, copyExtra } from "@/content/copy";
import type { PatternListItem } from "@/types";

const x = copyExtra.patterns;
const tableCopy: PatternsTableCopy = {
  searchPlaceholder: copy.patterns.searchPlaceholder,
  sortOptions: copy.patterns.sortOptions,
  sortPrefix: x.sortPrefix,
  columns: copy.patterns.columns,
  typeLabels: x.typeLabels,
  footer: x.footer,
  patternForms: copy.patterns.countForms,
  thresholdCount: x.thresholdCount,
  thresholdSum: x.thresholdSum,
  openPattern: x.openPattern,
};

const item = (over: Partial<PatternListItem>): PatternListItem => ({
  key: "sklep",
  name: "Sklep",
  type: "fixed",
  occurrences: 3,
  sumMinor: 123456,
  fixedAmountMinor: 4200,
  threshold: null,
  overMinor: 0,
  excluded: false,
  ...over,
});

function render(patterns: PatternListItem[]): string {
  return renderToStaticMarkup(createElement(PatternsTable, { patterns, copy: tableCopy }));
}

describe("PatternsTable render", () => {
  it("renders the headers in kit order", () => {
    const html = render([item({})]);
    const heads = [...html.matchAll(/<th[^>]*>([^<]+)<\/th>/g)].map((m) => m[1]);
    expect(heads).toEqual([...copy.patterns.columns]);
  });

  it("puts the Kwota cell before the Suma cell in a fixed row", () => {
    const html = render([item({})]);
    const cells = [...html.matchAll(/<td[^>]*>(.*?)<\/td>/g)].map((m) => m[1].replace(/<[^>]+>/g, ""));
    // cells: name, type, occurrences, Kwota, Suma, Próg, Ponad progiem, arrow
    expect(cells[3]).toContain("42");
    expect(cells[4]).toContain("1");
    expect(cells[3]).not.toBe(cells[4]);
    expect(cells[3]).toMatch(/42,00/);
    expect(cells[4]).toMatch(/^1234,56/);
  });
});
