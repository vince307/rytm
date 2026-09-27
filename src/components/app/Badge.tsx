// Badge — prototype .badge (styles.css). The kit's raw `.badge.fixed` / `.badge.frequent` backgrounds map onto
// Tailwind names exactly as InlineAlert maps the same values: green/15 and ink/8. `excess` is the kit's
// `.badge.excess` (background var(--amber), i.e. `excess`, text ink) — S-04's "ponad próg" mark. Further tones
// (`new` / `changed`) arrive with S-06.
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface BadgeProps {
  tone: "fixed" | "frequent" | "excess";
  children: ReactNode;
}

const tones = { fixed: "bg-green/15 text-green", frequent: "bg-ink/8 text-ink", excess: "bg-excess text-ink" } as const;

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
