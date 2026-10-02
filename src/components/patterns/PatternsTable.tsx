// PatternsTable — prototype patterns() toolbar + table + foot (app.js), search/sort as in bindInteractions().
// Renders only non-excluded patterns (`/patterns.astro` filters); the excluded ones go to `ExcludedPatterns`
// (S-05 Phase 7). DESIGN-GAP: G28 — status badges (nowy / zmiana kwoty, S-06) and „Pokaż więcej” stay omitted.
import { useMemo, useState } from "react";

import { Badge } from "@/components/app/Badge";
import { field, control } from "@/components/app/field-styles";
import { Glyph } from "@/components/Glyph";
import { formatMoney, plural } from "@/lib/format";
import { merchantMark } from "@/components/patterns/merchant-mark";
import { patternHref } from "@/lib/patterns/path";
import { tableHeaders } from "@/lib/patterns/table-columns";
import { cn } from "@/lib/utils";
import type { PatternListItem, Threshold } from "@/types";

type SortKey = "sum" | "count" | "name";
const SORT_KEYS: readonly SortKey[] = ["sum", "count", "name"];

export interface PatternsTableCopy {
  searchPlaceholder: string;
  /** `copy.patterns.sortOptions` — labels for suma / liczba / nazwa, in that order. */
  sortOptions: readonly string[];
  sortPrefix: string;
  /** `copy.patterns.columns` (round 3): Sprzedawca, Typ, Wystąpienia, Kwota, Suma, Próg, Ponad progiem. */
  columns: readonly string[];
  typeLabels: { fixed: string; frequent: string };
  footer: string;
  patternForms: readonly [string, string, string];
  /** Próg cell, `count` kind — `"{n} × / miesiąc"` (K21 verbatim format). */
  thresholdCount: string;
  /** Próg cell, `sum` kind — `"{amount} / miesiąc"` (G31 placeholder). */
  thresholdSum: string;
  /** Arrow cell `aria-label` — „Otwórz wzorzec” (K21). */
  openPattern: string;
}

interface PatternsTableProps {
  /** Already in the default order (sum desc, then name, then key). */
  patterns: PatternListItem[];
  copy: PatternsTableCopy;
}

const cell = "border-b border-line px-[17px] py-4 align-middle";
const head = cn(cell, "text-left text-[11px] font-extrabold tracking-[0.07em] whitespace-nowrap text-muted uppercase");
const focusRing = "outline-none focus-visible:ring-[3px] focus-visible:ring-ink/15";

/** Próg cell (kit `patternRows()`): `count` → „{n} × / miesiąc” (K21 verbatim), `amount` → the money itself,
 * `sum` → „{amount} / miesiąc” (G31 placeholder — the kit never renders a sum-kind threshold), none → „—”. */
function thresholdLabel(threshold: Threshold | null, copy: PatternsTableCopy): string {
  if (!threshold) return "—";
  if (threshold.kind === "count") return copy.thresholdCount.replace("{n}", String(threshold.value));
  if (threshold.kind === "amount") return formatMoney(threshold.value);
  return copy.thresholdSum.replace("{amount}", formatMoney(threshold.value));
}

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
                {tableHeaders(copy.columns).map((label) => (
                  <th key={label} className={head}>
                    {label}
                  </th>
                ))}
                <th className={head} aria-hidden="true"></th>
              </tr>
            </thead>
            <tbody className="[&>tr:last-child>td]:border-b-0">
              {visible.map((p) => (
                <tr key={p.key}>
                  <td className={cell}>
                    <a
                      href={patternHref(p.key)}
                      className={cn(
                        // kit `.merchant` does not forbid wrapping: a long name wraps so the arrow column fits at 1440 px
                        "text-ink flex items-center gap-2.5 rounded-sm font-extrabold no-underline",
                        focusRing,
                      )}
                    >
                      <span className={merchantMark} aria-hidden="true">
                        {Array.from(p.name)[0]}
                      </span>
                      <span>{p.name}</span>
                    </a>
                  </td>
                  <td className={cell}>
                    <Badge tone={p.type}>{copy.typeLabels[p.type]}</Badge>
                  </td>
                  <td className={cell}>{p.occurrences}</td>
                  <td className={cn(cell, "whitespace-nowrap")}>{formatMoney(p.sumMinor)}</td>
                  <td className={cn(cell, "whitespace-nowrap")}>
                    {p.fixedAmountMinor === null ? "—" : formatMoney(p.fixedAmountMinor)}
                  </td>
                  <td className={cn(cell, "whitespace-nowrap")}>{thresholdLabel(p.threshold, copy)}</td>
                  <td className={cn(cell, "whitespace-nowrap")}>
                    {p.overMinor > 0 ? (
                      <span className="text-excess-text font-extrabold">{formatMoney(p.overMinor)}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className={cn(cell, "text-right")}>
                    <a
                      href={patternHref(p.key)}
                      aria-label={copy.openPattern}
                      className={cn(
                        "border-line text-ink grid size-[30px] place-items-center rounded-[7px] border",
                        focusRing,
                      )}
                    >
                      <Glyph name="arrow" />
                    </a>
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
