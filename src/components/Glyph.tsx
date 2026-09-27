// Glyph — the kit UI icon sprite for React components; same markup as Icon.astro.
import type { IconName } from "@/content/copy";
import { cn } from "@/lib/utils";

interface GlyphProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function Glyph({ name, size = 16, className }: GlyphProps) {
  return (
    <svg
      className={cn("rytm-icon inline-block shrink-0 align-[-0.18em]", className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <use href={`/rytm/icons/ui/ui.svg#${name}`} />
    </svg>
  );
}
