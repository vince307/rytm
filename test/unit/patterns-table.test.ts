import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PatternsTable, type PatternRow, type PatternsTableCopy } from "@/components/patterns/PatternsTable";
import { getCopy } from "@/content/copy";

const { copy, copyExtra } = getCopy("pl");

const x = copyExtra.patterns;
const tableCopy: PatternsTableCopy = {
  searchPlaceholder: copy.patterns.searchPlaceholder,
  sortOptions: copy.patterns.sortOptions,
  sortPrefix: x.sortPrefix,
  columns: copy.patterns.columns,
  typeLabels: x.typeLabels,
  footer: x.footer,
  patternForms: copy.patterns.countForms as [string, string, string],
  thresholdCount: x.thresholdCount,
  thresholdSum: x.thresholdSum,
  openPattern: x.openPattern,
  showMore: copy.patterns.showMore,
  statusLabels: { new: copy.components.new, changed: copy.components.changed },
};

const item = (over: Partial<PatternRow>): PatternRow => ({
  key: "sklep",
  name: "Sklep",
  type: "fixed",
  occurrences: 3,
  sumMinor: 123456,
  fixedAmountMinor: 4200,
  threshold: null,
  overMinor: 0,
  excluded: false,
  status: null,
  ...over,
});

function render(patterns: PatternRow[]): string {
  return renderToStaticMarkup(createElement(PatternsTable, { patterns, copy: tableCopy, locale: "pl" }));
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

  it("renders a status badge after the Ponad progiem value, none when status is null", () => {
    const html = render([
      item({ status: "new" }),
      item({ key: "b", name: "B", status: "changed" }),
      item({ key: "c", name: "C" }),
    ]);
    expect(html).toContain(`>${copy.components.new}<`);
    expect(html).toContain(`>${copy.components.changed}<`);
    expect(html.match(new RegExp(`>${copy.components.new}<`, "g"))).toHaveLength(1);
  });

  it("pages a 12-row list: 10 body rows, the button, count line for all 12", () => {
    const rows = Array.from({ length: 12 }, (_, i) => item({ key: `k${i}`, name: `Sklep ${i}`, sumMinor: 1000 + i }));
    const html = render(rows);
    expect(html.match(/<tr/g)).toHaveLength(11); // 1 head + 10 body
    expect(html).toContain(`>${copy.patterns.showMore}<`);
    expect(html).toContain(">12 ");
  });

  it("shows no button for a short list", () => {
    expect(render([item({})])).not.toContain(`>${copy.patterns.showMore}<`);
  });
});
