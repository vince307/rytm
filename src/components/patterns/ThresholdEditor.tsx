// ThresholdEditor — kit thresholdEditor() (prototype/app.js) on real state (S-04, faza 5). A fixed pattern gets
// one non-interactive "Akceptowana kwota" option (the kit itself renders it as a decorative active button with
// no onclick); a frequent pattern gets the real "Liczba na miesiąc" / "Suma na miesiąc" toggle, switching which
// field the save form posts. The save form POSTs to /api/patterns/threshold; "Usuń próg" is a plain Button
// (type="submit") targeting a sibling <form> via the `form` attribute — forms cannot nest (S-04 Critical
// Implementation Details, "Nested forms").
import { useId, useState } from "react";
import { fieldBox } from "@/components/app/field-styles";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { usePageShowReset } from "@/components/hooks/usePageShowReset";
import { formatThresholdInput } from "@/lib/patterns/threshold-form";
import { cn } from "@/lib/utils";
import type { PatternType, Threshold, ThresholdKind } from "@/types";

export interface ThresholdEditorCopy {
  acceptedAmount: string;
  countPerMonth: string;
  sumPerMonth: string;
  valueLabel: { amount: string; count: string };
  suffix: { money: string; count: string };
  empty: string;
  active: string;
  setThreshold: string;
  save: string;
  remove: string;
  saving: string;
}

interface ThresholdEditorProps {
  patternKey: string;
  type: PatternType;
  /** Only when its kind already applies to `type` (S-04 decision 3) — never a stale, mismatched threshold. */
  threshold: Threshold | null;
  month: string;
  copy: ThresholdEditorCopy;
}

// Kit `.threshold-option`: radius 8px, inherited (400) weight — not the app-wide `rounded-lg` (14px) / bold.
const switchBase = "rounded-[8px] border px-[11px] py-[9px] text-xs";
const switchActive = "border-ink bg-ink text-paper";
const switchIdle = "border-line text-muted";

export function ThresholdEditor({ patternKey, type, threshold, month, copy }: ThresholdEditorProps) {
  const deleteFormId = useId();
  const [saving, setSaving] = useState(false);
  // S-04 F8 / undo-import F4: a bfcache restore (back-navigation after the POST) must not leave the button stuck.
  usePageShowReset(() => {
    setSaving(false);
  });
  // Frequent patterns can switch between count/sum before saving; fixed has exactly one kind, no toggle.
  const [frequentKind, setFrequentKind] = useState<"count" | "sum">(threshold?.kind === "sum" ? "sum" : "count");
  const activeKind: ThresholdKind = type === "fixed" ? "amount" : frequentKind;

  const valueLabel = activeKind === "count" ? copy.valueLabel.count : copy.valueLabel.amount;
  const suffix = activeKind === "count" ? copy.suffix.count : copy.suffix.money;
  const inputMode = activeKind === "count" ? "numeric" : "decimal";
  const defaultValue = threshold?.kind === activeKind ? formatThresholdInput(threshold) : "";

  return (
    <div className="threshold-editor">
      <form
        method="POST"
        action="/api/patterns/threshold"
        onSubmit={() => {
          setSaving(true);
        }}
      >
        <input type="hidden" name="key" value={patternKey} />
        <input type="hidden" name="kind" value={activeKind} />
        <input type="hidden" name="month" value={month} />

        <div className="mb-6 flex gap-[7px]">
          {type === "fixed" ? (
            <span className={cn(switchBase, switchActive)}>{copy.acceptedAmount}</span>
          ) : (
            <>
              <button
                type="button"
                aria-pressed={frequentKind === "count"}
                className={cn(switchBase, frequentKind === "count" ? switchActive : switchIdle)}
                onClick={() => {
                  setFrequentKind("count");
                }}
              >
                {copy.countPerMonth}
              </button>
              <button
                type="button"
                aria-pressed={frequentKind === "sum"}
                className={cn(switchBase, frequentKind === "sum" ? switchActive : switchIdle)}
                onClick={() => {
                  setFrequentKind("sum");
                }}
              >
                {copy.sumPerMonth}
              </button>
            </>
          )}
        </div>

        <div className="grid gap-[7px]">
          <label className="grid gap-[7px] text-xs font-bold">
            <span>{valueLabel}</span>
            {/* kit `.input-suffix`: radius 8px; the suffix `b` keeps its bolder weight; the shared `fieldBox`
                (`--rytm-field` = paper). */}
            <div className={cn(fieldBox, "flex items-center overflow-hidden")}>
              {/* keyed on the active kind so switching frequent/sum resets the field to that kind's own stored value */}
              <input
                key={activeKind}
                name="value"
                inputMode={inputMode}
                placeholder="—"
                defaultValue={defaultValue}
                className="text-ink min-w-0 flex-1 border-0 bg-transparent p-[13px] text-lg outline-none"
              />
              <b className="text-muted px-[13px] text-[13px]">{suffix}</b>
            </div>
          </label>
        </div>

        <p className="text-muted my-[17px] text-[13px] leading-[1.55]">{threshold ? copy.active : copy.empty}</p>

        <div className="flex items-center gap-[15px]">
          <SubmitButton variant="primary" size="default" showArrow={false} pending={saving} pendingText={copy.saving}>
            {threshold ? copy.save : copy.setThreshold}
          </SubmitButton>
          {threshold && (
            <Button variant="text" size="inline" type="submit" form={deleteFormId}>
              {copy.remove}
            </Button>
          )}
        </div>
      </form>

      {threshold && (
        <form id={deleteFormId} method="POST" action="/api/patterns/threshold/delete">
          <input type="hidden" name="key" value={patternKey} />
          <input type="hidden" name="month" value={month} />
        </form>
      )}
    </div>
  );
}
