// Decision endpoint input parsing and endpoint redirect targets (FR-009/US-03). Kept pure so validation is
// proven without a server, mirroring src/lib/patterns/threshold-form.ts. `decisionKeySchema` is parsed first
// (S-04 F4 lesson: a broken form must still land the error on the right pattern's detail, never a silent
// redirect to /patterns) — only once `key` itself is usable does `decisionSchema` decide which action ran.
import { z } from "zod";

import { patternHref } from "@/lib/patterns/path";
import type { MerchantPattern } from "@/types";

const keyField = z.string().min(1).max(500);

/** Parsed first, alone: a form with no usable `key` has nowhere to redirect but `/patterns` itself.
 * `.loose()` so the remaining, action-specific fields are still available to `decisionSchema`. */
export const decisionKeySchema = z.object({ key: keyField }).loose();

export const decisionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("merge"), key: keyField, target: keyField }),
  z.object({ action: z.literal("unmerge"), key: keyField, source: keyField }),
  z.object({ action: z.literal("type"), key: keyField, type: z.enum(["fixed", "frequent"]) }),
  z.object({ action: z.literal("rename"), key: keyField, name: z.string() }),
  z.object({ action: z.literal("exclude"), key: keyField }),
  z.object({ action: z.literal("restore"), key: keyField, back: z.literal("list").optional() }),
]);

export type DecisionInput = z.infer<typeof decisionSchema>;

/** Trims the raw rename field; an empty result clears the override (`null`), over 100 characters is rejected
 * without touching the database. "invalid" is a distinct sentinel literal callers narrow on with `=== "invalid"`. */
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents -- the rule sees "invalid" as subsumed by the broader `string` case, but callers narrow on the exact literal
export function parseDisplayName(raw: string): string | null | "invalid" {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (trimmed.length > 100) return "invalid";
  return trimmed;
}

/** A merge is valid only between two *current roots* — `source` and `target` must each own a pattern in this
 * read (an absorbed key, or one whose owning import was deleted, is not among `patterns`) — `target` must
 * differ from `source`, and `target` must not itself be excluded. Reads `patterns`, never `decisions` directly,
 * so it agrees with whatever `derivePatterns` just resolved. */
export function validateMerge(patterns: readonly MerchantPattern[], source: string, target: string): boolean {
  if (source === target) return false;
  const targetPattern = patterns.find((p) => p.key === target);
  if (!targetPattern || targetPattern.excluded) return false;
  return patterns.some((p) => p.key === source);
}

export type DecisionStatus =
  | "merged"
  | "unmerged"
  | "typed"
  | "renamed"
  | "excluded"
  | "restored"
  | "error-merge"
  | "error-name"
  | "error-decision";

const STATUS_PARAMS: Record<DecisionStatus, Record<string, string>> = {
  merged: { merged: "1" },
  unmerged: { unmerged: "1" },
  typed: { typed: "1" },
  renamed: { renamed: "1" },
  excluded: { excluded: "1" },
  restored: { restored: "1" },
  "error-merge": { error: "merge" },
  "error-name": { error: "name" },
  "error-decision": { error: "decision" },
};

/** Where the decision endpoint redirects after acting on `key`, carrying the result as a query param.
 * `back === "list"` sends the result to `/patterns` instead of the pattern's own detail (used by the list's
 * restore form, Phase 7) — the status param is the same either way. */
export function decisionRedirect(key: string, status: DecisionStatus, back?: "list"): string {
  const params = STATUS_PARAMS[status];
  if (back === "list") {
    return `/patterns?${new URLSearchParams(params).toString()}`;
  }
  return patternHref(key, params);
}
