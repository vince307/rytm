// Stepper — prototype .import-flow / .flow-step / .flow-line (app.js:57).
import { cn } from "@/lib/utils";

interface StepperProps {
  steps: readonly string[];
  /** 1-based index of the active step. */
  current: number;
}

export function Stepper({ steps, current }: StepperProps) {
  return (
    <ol className="-mt-[7px] mb-6 flex max-w-[620px] list-none items-center p-0">
      {steps.map((label, i) => (
        <li
          key={label}
          className={cn(
            "text-muted flex items-center gap-2 text-xs whitespace-nowrap",
            i > 0 && "flex-1",
            i + 1 === current && "text-ink font-extrabold",
          )}
          aria-current={i + 1 === current ? "step" : undefined}
        >
          {i > 0 && <span className="bg-line mx-3.5 h-px flex-1 max-[559px]:mx-2" aria-hidden="true"></span>}
          <b
            className={cn(
              "border-line grid size-[25px] place-items-center rounded-full border",
              i + 1 === current && "border-ink bg-ink text-paper",
            )}
          >
            {i + 1}
          </b>
          <span className="max-[559px]:hidden">{label}</span>
        </li>
      ))}
    </ol>
  );
}
