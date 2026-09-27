// PatternsTable — prototype patterns() toolbar + table + foot (app.js), search/sort as in bindInteractions().
// DESIGN-GAP: G28 — columns Próg / Ponad progiem, the row link + arrow to the pattern detail, status badges, the
// excluded section and „Pokaż więcej” are omitted until S-04 / S-05 / S-06.
import { useMemo, useState } from "react";

import { Badge } from "@/components/app/Badge";
import { Glyph } from "@/components/Glyph";
import { formatMoney, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PatternListItem } from "@/types";

type SortKey = "sum" | "count" | "name";
const SORT_KEYS: readonly SortKey[] = ["sum", "count", "name"];

export interface PatternsTableCopy {
  searchPlaceholder: string;
  /** `copy.patterns.sortOptions` — labels for suma / liczba / nazwa, in that order. */
  sortOptions: readonly string[];
  sortPrefix: string;
  /** Sprzedawca, Typ, Wystąpienia, Suma. */
  columns: readonly string[];
  amountColumn: string;
  typeLabels: { fixed: string; frequent: string };
  footer: string;
  patternForms: readonly [string, string, string];
}

interface PatternsTableProps {
  /** Already in the default order (sum desc, then name, then key). */
  patterns: PatternListItem[];
  copy: PatternsTableCopy;
}

const cell = "border-b border-line px-[17px] py-4 align-middle";
const head = cn(cell, "text-left text-[11px] font-extrabold tracking-[0.07em] whitespace-nowrap text-muted uppercase");
// DESIGN-GAP: G29 — the kit's .search-field / .select-field drop the control outline and define no focus style; the
// wrapper borrows the kit's own `.field input:focus` (border ink + 3px ring ink/8, as FormField) via focus-within.
const field =
  "flex min-h-[43px] items-center gap-2 rounded-lg border border-line bg-paper px-3 text-muted transition-colors focus-within:border-ink focus-within:ring-[3px] focus-within:ring-ink/8 max-[559px]:w-full";
// The native search clear button is a browser colour outside the token set and absent from the kit's plain input.
const control =
  "w-full min-w-0 border-0 bg-transparent text-[13px] text-ink outline-none [&::-webkit-search-cancel-button]:appearance-none";

export function PatternsTable({ patterns, copy }: PatternsTableProps) {
  const [term, setTerm] = useState("");
  const [sort, setSort] = useState<SortKey>("sum");

  const visible = useMemo(() => {
    const needle = term.toLowerCase();
    // The input order is the tie-breaker (stable sort), so equal sums/counts keep the server's order.
    const list = patterns.filter((p) => p.name.toLowerCase().includes(needle));
    if (sort === "name") return list.sort((a, b) => a.name.localeCompare(b.name, "pl"));
    if (sort === "count") return list.sort((a, b) => b.occurrences - a.occurrences);
    return list.sort((a, b) => b.sumMinor - a.sumMinor);
  }, [patterns, term, sort]);

  const footer = copy.footer
    .replace("{n}", String(visible.length))
    .replace("{patterns}", plural(visible.length, copy.patternForms));

  return (
    <>
      <div className="mb-3.5 flex gap-2.5 max-[559px]:flex-col">
        <label className={cn(field, "w-[min(330px,100%)]")}>
          <Glyph name="search" />
          <input
            type="search"
            className={control}
            placeholder={copy.searchPlaceholder}
            aria-label={copy.searchPlaceholder}
            value={term}
            onChange={(event) => {
              setTerm(event.target.value);
            }}
          />
        </label>
        <label className={cn(field, "min-w-[180px]")}>
          <Glyph name="sort" />
          <select
            className={cn(control, "appearance-none")}
            aria-label={copy.sortPrefix.trim()}
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as SortKey);
            }}
          >
            {SORT_KEYS.map((key, i) => (
              <option key={key} value={key}>
                {copy.sortPrefix}
                {copy.sortOptions[i]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <section className="border-line bg-paper rounded-xl border">
        <div className="overflow-auto max-[559px]:-mr-px">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                {copy.columns.slice(0, 4).map((label) => (
                  <th key={label} className={head}>
                    {label}
                  </th>
                ))}
                {/* DESIGN-GAP: K17 — FR-007 amount of a fixed pattern; the kit table has no such column. */}
                <th className={head}>{copy.amountColumn}</th>
              </tr>
            </thead>
            <tbody className="[&>tr:last-child>td]:border-b-0">
              {visible.map((p) => (
                <tr key={p.key}>
                  <td className={cell}>
                    <span className="text-ink flex items-center gap-2.5 font-extrabold whitespace-nowrap">
                      <span
                        className="bg-paper-soft grid size-[30px] shrink-0 place-items-center rounded-lg text-[11px] font-extrabold"
                        aria-hidden="true"
                      >
                        {Array.from(p.name)[0]}
                      </span>
                      <span>{p.name}</span>
                    </span>
                  </td>
                  <td className={cell}>
                    <Badge tone={p.type}>{copy.typeLabels[p.type]}</Badge>
                  </td>
                  <td className={cell}>{p.occurrences}</td>
                  <td className={cn(cell, "whitespace-nowrap")}>{formatMoney(p.sumMinor)}</td>
                  <td className={cn(cell, "whitespace-nowrap")}>
                    {p.fixedAmountMinor === null ? "—" : formatMoney(p.fixedAmountMinor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-line text-muted flex items-center justify-between border-t px-[17px] py-[13px] text-xs max-[559px]:flex-col max-[559px]:items-start">
          <span>{footer}</span>
        </div>
      </section>
    </>
  );
}
