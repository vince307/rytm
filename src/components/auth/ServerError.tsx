import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ServerErrorProps {
  message?: ReactNode;
  /** Actions after the message inside the alert (prototype `.import-errors .text-button`). */
  children?: ReactNode;
  className?: string;
}

export function ServerError({ message, children, className }: ServerErrorProps) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={cn(
        "bg-excess/25 text-excess-text mb-2 flex items-start gap-2 rounded-lg px-[13px] py-3 text-[13px] leading-snug",
        className,
      )}
    >
      <svg className="rytm-icon mt-px shrink-0" width={16} height={16} viewBox="0 0 24 24" aria-hidden="true">
        <use href="/rytm/icons/ui/ui.svg#warning" />
      </svg>
      <span>
        {message}
        {children}
      </span>
    </div>
  );
}
