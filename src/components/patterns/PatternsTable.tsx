// PatternsTable — prototype patterns() toolbar + table + foot (app.js), search/sort as in bindInteractions().
// Renders only non-excluded patterns (`/patterns.astro` filters); the excluded ones go to `ExcludedPatterns`
// (S-05 Phase 7).
import { useMemo, useState } from "react";

import { Badge } from "@/components/app/Badge";
import { field, control, focusRing } from "@/components/app/field-styles";
import { Glyph } from "@/components/Glyph";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { listView, type PatternSort } from "@/lib/patterns/list-view";
import { formatMoney, plural } from "@/lib/format";
import { merchantMark } from "@/components/patterns/merchant-mark";
import { patternHref } from "@/lib/patterns/path";
import { cn } from "@/lib/utils";
import type { PatternListItem, Threshold } from "@/types";

type SortKey = PatternSort;
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
  /** `copy.patterns.countForms` (kit round 3) — content.json types it `string[]`; the page hands over the three forms. */
  patternForms: readonly [string, string, string];
  /** Próg cell, `count` kind — `"{n} × / miesiąc"` (K21 verbatim format). */
  thresholdCount: string;
  /** Próg cell, `sum` kind — `"{amount} / miesiąc"` (G31 placeholder). */
  thresholdSum: string;
  /** Arrow cell `aria-label` — „Otwórz wzorzec” (K21). */
  openPattern: string;
  /** `copy.patterns.showMore` — the table-foot button. */
  showMore: string;
  /** `copy.components.new` / `.changed`. */
  statusLabels: { new: string; changed: string };
}

/** A list row plus its status in the reference month (`patternStatuses`); the island never computes it. */
export type PatternRow = PatternListItem & { status: "new" | "changed" | null };

interface PatternsTableProps {
  /** Already in the default order (sum desc, then name, then key). */
  patterns: PatternRow[];
  copy: PatternsTableCopy;
  locale: Locale;
}

const cell = "border-b border-line px-[17px] py-4 align-middle";
const head = cn(cell, "text-left text-[11px] font-extrabold tracking-[0.07em] whitespace-nowrap text-muted uppercase");

/** Próg cell (kit `patternRows()`): `count` → „{n} × / miesiąc” (K21 verbatim), `amount` → the money itself,
 * `sum` → „{amount} / miesiąc” (G31 placeholder — the kit never renders a sum-kind threshold), none → „—”. */
function thresholdLabel(threshold: Threshold | null, copy: PatternsTableCopy, locale: Locale): string {
  if (!threshold) return "—";
  if (threshold.kind === "count") return copy.thresholdCount.replace("{n}", String(threshold.value));
  if (threshold.kind === "amount") return formatMoney(threshold.value, locale);
  return copy.thresholdSum.replace("{amount}", formatMoney(threshold.value, locale));
}

export function PatternsTable({ patterns, copy, locale }: PatternsTableProps) {
  const [term, setTerm] = useState("");
  const [sort, setSort] = useState<SortKey>("sum");

  const [expanded, setExpanded] = useState(false);

  const { shown, total, hasMore } = useMemo(
    () => listView(patterns, term, sort, expanded),
    [patterns, term, sort, expanded],
  );

  const footer = copy.footer
    .replace("{n}", String(total))
    .replace("{patterns}", plural(total, copy.patternForms, locale));

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
                {copy.columns.map((label) => (
                  <th key={label} className={head}>
                    {label}
                  </th>
                ))}
                <th className={head} aria-hidden="true"></th>
              </tr>
            </thead>
            <tbody className="[&>tr:last-child>td]:border-b-0">
              {shown.map((p) => (
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
                  <td className={cn(cell, "whitespace-nowrap")}>
                    {p.fixedAmountMinor === null ? "—" : formatMoney(p.fixedAmountMinor, locale)}
                  </td>
                  <td className={cn(cell, "whitespace-nowrap")}>{formatMoney(p.sumMinor, locale)}</td>
                  <td className={cn(cell, "whitespace-nowrap")}>{thresholdLabel(p.threshold, copy, locale)}</td>
                  <td className={cn(cell, "whitespace-nowrap")}>
                    {p.overMinor > 0 ? (
                      <span className="text-excess-text font-extrabold">{formatMoney(p.overMinor, locale)}</span>
                    ) : (
                      "—"
                    )}
                    {p.status ? (
                      <span className="ml-2 inline-block">
                        <Badge tone={p.status}>{copy.statusLabels[p.status]}</Badge>
                      </span>
                    ) : null}
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
        <div className="border-line text-muted flex items-center justify-between border-t px-[17px] py-[13px] text-xs max-[559px]:flex-col max-[559px]:items-start max-[559px]:gap-[13px]">
          <span>{footer}</span>
          {hasMore ? (
            <Button
              variant="ghost"
              onClick={() => {
                setExpanded(true);
              }}
            >
              {copy.showMore}
            </Button>
          ) : null}
        </div>
      </section>
    </>
  );
}
