// Accessible label of the large occurrence sequence (kit `patternDetail` aria-label shape, decision 5): both counts
// take the Polish plural forms, no trailing full stop. `within = count − over`.
import { plural } from "@/lib/format";

export function sequenceLabel(count: number, over: number, template: string, forms: readonly string[]): string {
  const within = count - over;
  return template
    .replace("{within}", String(within))
    .replace("{withinForms}", plural(within, forms))
    .replace("{over}", String(over))
    .replace("{overForms}", plural(over, forms));
}
