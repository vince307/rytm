import { useState } from "react";
import NewPasswordForm, { type NewPasswordLabels } from "@/components/auth/NewPasswordForm";
import { Button } from "@/components/ui/button";

interface Props {
  label: string;
  masked: string;
  toggleLabel: string;
  cancelLabel: string;
  current: { label: string };
  formLabels: NewPasswordLabels;
}

// Kit `settings()` + `togglePasswordForm()`: masked value and a ghost toggle; the form opens below the row.
// Kit `.settings-password-form`: top border, no bottom border; „Zapisz hasło” has no ↗ (kit `settings()`).
// Row classes mirror `SettingsRow.astro` (an Astro component cannot be used inside an island).
export default function SettingsPasswordRow({ label, masked, toggleLabel, cancelLabel, current, formLabels }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="border-line grid min-h-[70px] grid-cols-[190px_1fr_auto] items-center gap-[15px] border-b text-[13px] max-[899px]:grid-cols-[1fr_auto]">
        <span className="text-muted text-xs max-[899px]:col-span-full">{label}</span>
        <strong>{masked}</strong>
        <Button
          type="button"
          variant="ghost"
          aria-expanded={open}
          aria-controls="settings-password-form"
          onClick={() => {
            setOpen(!open);
          }}
        >
          {toggleLabel}
        </Button>
      </div>
      {open && (
        <div id="settings-password-form" className="border-line border-t py-[18px]">
          <div className="max-w-[460px]">
            <NewPasswordForm
              action="/api/auth/password"
              current={current}
              labels={formLabels}
              cancel={{
                label: cancelLabel,
                onCancel: () => {
                  setOpen(false);
                },
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
