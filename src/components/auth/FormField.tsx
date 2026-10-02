import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  id: string;
  name?: string;
  label: string;
  optionalLabel?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  hint?: ReactNode;
  endContent?: ReactNode;
  disabled?: boolean;
}

export function FormField({
  id,
  name,
  label,
  optionalLabel,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
  hint,
  endContent,
  disabled,
}: FormFieldProps) {
  return (
    <div className="my-[15px] grid gap-2">
      <label htmlFor={id} className="text-[13px] font-bold">
        {label}
        {optionalLabel && <span className="text-muted ml-1.5 font-medium">{optionalLabel}</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name ?? id}
          type={type}
          value={value}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          onChange={(e) => {
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          className={cn(
            "text-ink placeholder:text-muted/70 focus:border-ink focus:ring-ink/8 bg-paper w-full rounded-[8px] border px-3.5 py-[13px] transition-colors outline-none focus:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60",
            error ? "border-excess-text" : "border-line",
            endContent && "pr-11",
          )}
        />
        {endContent}
      </div>
      {error ? <p className="text-excess-text text-xs font-semibold">{error}</p> : hint}
    </div>
  );
}
