// Status of a fixed pattern in the reference month, for the `/patterns` badges (kit `badge(p.status)`).
// Derived from the same `fixedOverview` `/fixed` uses; `new` wins over `changed` (the rule already makes them disjoint).
import type { fixedOverview } from "@/lib/patterns/fixed";

export type PatternStatus = "new" | "changed";

export function patternStatuses(overview: ReturnType<typeof fixedOverview>): Map<string, PatternStatus> {
  const map = new Map<string, PatternStatus>();
  for (const row of overview.changed) map.set(row.key, "changed");
  for (const row of overview.new) map.set(row.key, "new");
  return map;
}
