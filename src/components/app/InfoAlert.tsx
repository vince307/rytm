import type { ReactNode } from "react";
import { Glyph } from "@/components/Glyph";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
}

// React twin of InlineAlert.astro kind="info" (kit .inline-alert.info) for islands: the delete dialog (S-13 P3)
// and the wizard (P5). Same spacing and tone classes as the Astro component.
export function InfoAlert({ children, className }: Props) {
  return (
    <div
      role="status"
      className={cn(
        "bg-ink/8 text-ink flex items-start gap-[9px] rounded-lg px-[13px] py-3 text-[13px] leading-snug",
        className,
      )}
    >
      <Glyph name="info" size={16} className="mt-px" />
      <span>{children}</span>
    </div>
  );
}
