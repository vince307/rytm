// Badge — prototype .badge (styles.css). The kit's raw `.badge.fixed` / `.badge.frequent` backgrounds map onto
// Tailwind names exactly as InlineAlert maps the same values: green/15 and ink/8. `excess` is the kit's
// `.badge.excess` (background var(--amber), i.e. `excess`, text ink) — S-04's "ponad próg" mark.
// DESIGN-GAP: G34 — `new` (S-06, `/fixed` "Nowe w tym miesiącu") has no token of its own: the prototype's later,
// winning CSS rule renders `.badge.new` / `.badge.changed` in amber (not the earlier grey-blue it overrides — K9),
// so this tone reuses the same tint `InlineAlert` uses for its error state — `bg-excess/25 text-excess-text`.
// `changed` stays unimplemented until the `/patterns` status badges (G28).
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface BadgeProps {
  tone: "fixed" | "frequent" | "excess" | "new";
  children: ReactNode;
}

const tones = {
  fixed: "bg-green/15 text-green",
  frequent: "bg-ink/8 text-ink",
  excess: "bg-excess text-ink",
  new: "bg-excess/25 text-excess-text",
} as const;

export function Badge({ tone, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-[23px] items-center rounded-full px-2 py-[3px] text-[11px] leading-none font-extrabold whitespace-nowrap",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
