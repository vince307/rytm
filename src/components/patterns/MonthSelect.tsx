// MonthSelect — kit `.select-field.small` (styles.css): a plain GET form so the month choice works with no
// client JS (the browser submits the form on its own "go" affordance) and, for anyone who does have JS,
// `requestSubmit()` fires on change instead (S-04 decision 19). No `action` — it submits to the current
// `/patterns/<key>` path, replacing any existing query string with `?month=…`.
import { cn } from "@/lib/utils";
import { field, control } from "@/components/app/field-styles";

export interface MonthOption {
  value: string;
  label: string;
}

interface MonthSelectProps {
  months: MonthOption[];
  value: string;
  /** aria-label for the select — the panel has no separate visible label for it (kit `.select-field.small`). */
  label: string;
}

export function MonthSelect({ months, value, label }: MonthSelectProps) {
  return (
    <form method="get" className={cn(field, "min-h-[34px] min-w-[126px] px-2")}>
      <select
        name="month"
        className={cn(control, "appearance-none")}
        aria-label={label}
        defaultValue={value}
        onChange={(event) => {
          event.currentTarget.form?.requestSubmit();
        }}
      >
        {months.map((month) => (
          <option key={month.value} value={month.value}>
            {month.label}
          </option>
        ))}
      </select>
    </form>
  );
}
