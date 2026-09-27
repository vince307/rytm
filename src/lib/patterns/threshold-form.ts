// Threshold editor input parsing and endpoint redirect targets (FR-010). Kept pure so validation is proven
// without a server; the save / delete endpoints (Phase 5) parse with these before touching the database.
import { z } from "zod";

import { patternHref } from "@/lib/patterns/path";
import type { ThresholdKind, Threshold } from "@/types";

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

export const thresholdSaveSchema = z.object({
  key: z.string().min(1).max(500),
  kind: z.enum(["count", "sum", "amount"]),
  value: z.string(),
  month: z.string().regex(MONTH).optional(),
});

export const thresholdDeleteSchema = z.object({
  key: z.string().min(1).max(500),
  month: z.string().regex(MONTH).optional(),
});

const COUNT_MAX = 999;
const MONEY_MAX_MINOR = 100_000_000; // 1 000 000 zł (S-04 decision 23)

/** Strips spaces (incl. NBSP) and validates/parses the editor's raw input into the stored unit: a plain count
 * for `count`, grosze for `sum` / `amount` (string-split decimal arithmetic — never a float, never rounds).
 * Anything out of shape or out of range returns `null`. */
export function parseThresholdValue(kind: ThresholdKind, raw: string): number | null {
  const cleaned = raw.replace(/\s/g, ""); // \s already matches NBSP (U+00A0)

  if (kind === "count") {
    if (!/^\d+$/.test(cleaned)) return null;
    const value = Number(cleaned);
    return value >= 1 && value <= COUNT_MAX ? value : null;
  }

  const match = /^(\d{1,7})(?:[.,](\d{1,2}))?$/.exec(cleaned);
  if (!match) return null;
  const [, whole, frac = ""] = match;
  const value = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  return value >= 1 && value <= MONEY_MAX_MINOR ? value : null;
}

/** Inverse of `parseThresholdValue` for pre-filling the editor: `"4"` for a count, `"55"` / `"55,50"` for money
 * (whole zloty drop the decimal part; the kit shows no trailing `,00`). */
export function formatThresholdInput(threshold: Threshold): string {
  if (threshold.kind === "count") return String(threshold.value);
  const whole = Math.floor(threshold.value / 100);
  const frac = threshold.value % 100;
  return frac === 0 ? String(whole) : `${whole},${String(frac).padStart(2, "0")}`;
}

export type ThresholdSaveStatus = "saved" | "removed" | "error-value" | "error-save";

const STATUS_PARAMS: Record<ThresholdSaveStatus, Record<string, string>> = {
  saved: { saved: "1" },
  removed: { removed: "1" },
  "error-value": { error: "value" },
  "error-save": { error: "save" },
};

/** Where the save / delete endpoint redirects after acting on `key`, carrying the result as a query param. */
export function thresholdRedirect(key: string, status: ThresholdSaveStatus, month?: string): string {
  return patternHref(key, STATUS_PARAMS[status], month);
}
