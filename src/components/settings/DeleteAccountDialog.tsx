import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormField } from "@/components/auth/FormField";
import { InfoAlert } from "@/components/app/InfoAlert";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { cn } from "@/lib/utils";
import { DELETE_CONFIRM_WORD } from "@/lib/auth-rules";

export interface DeleteAccountLabels {
  trigger: string;
  eyebrow: string;
  title: string;
  body: string;
  confirmationHint: string;
  placeholder: string;
  currentPassword: string;
  passwordPlaceholder: string;
  confirm: string;
  pending: string;
  close: string;
  /** Kit `settings.deleteDisabledHelp` — muted line while the button is locked. */
  disabledHelp: string;
  /** Kit `settings.demoDeleteBlocked` — shown for the shared demo account. */
  demoNote: string;
}

interface Props {
  labels: DeleteAccountLabels;
  /** The shared demo account: password field and button disabled; the server guard in api/auth/delete.ts stays. */
  demo: boolean;
}

// Kit round 3 `modal('deleteAccount')`: password + the `USUŃ` word unlock the button; the eyebrow, title and body
// stay in `copyExtra.settings` (design-kit.md K15). Opens closed; server errors show on the page.
const CONFIRM_ID = "delete-account-confirm";
const HELP_ID = "delete-account-help";

export default function DeleteAccountDialog({ labels, demo }: Props) {
  // A failed deletion comes back as ?error=delete(-password): the alert lives on the page, the dialog stays closed.
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const showHelp = !demo && (currentPassword.length === 0 || confirmation.trim() !== DELETE_CONFIRM_WORD);
  const locked = demo || currentPassword.length === 0 || confirmation.trim() !== DELETE_CONFIRM_WORD;
  const confirmParts = labels.confirmationHint.split(DELETE_CONFIRM_WORD);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="danger">{labels.trigger}</Button>
      </DialogTrigger>
      <DialogContent closeLabel={labels.close}>
        <div className="text-excess-text text-xs font-extrabold tracking-[0.14em] uppercase">{labels.eyebrow}</div>
        <DialogTitle>{labels.title}</DialogTitle>
        <DialogDescription>{labels.body}</DialogDescription>
        <form method="POST" action="/api/auth/delete" className="mt-[18px]">
          {/* The /settings password form already owns the id "current"; the endpoint reads the name. */}
          <FormField
            id="delete-current"
            name="current"
            type="password"
            autoComplete="current-password"
            label={labels.currentPassword}
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder={labels.passwordPlaceholder}
            disabled={demo}
          />
          <p id={CONFIRM_ID} className="text-muted mb-2 text-sm">
            {confirmParts[0]}
            {confirmParts.length > 1 && (
              <>
                <strong className="text-ink font-bold">{DELETE_CONFIRM_WORD}</strong>
                {confirmParts[1]}
              </>
            )}
          </p>
          {/* The password form on /settings already owns the id "confirm"; the endpoint reads the name. */}
          <input
            id="delete-confirm"
            name="confirm"
            type="text"
            value={confirmation}
            onChange={(e) => {
              setConfirmation(e.target.value);
            }}
            autoComplete="off"
            aria-describedby={showHelp ? `${CONFIRM_ID} ${HELP_ID}` : CONFIRM_ID}
            placeholder={labels.placeholder}
            className={cn(
              "border-line text-ink placeholder:text-muted/70 focus:border-ink focus:ring-ink/8 bg-paper w-full rounded-[8px] border p-[13px] transition-colors outline-none focus:ring-[3px]",
              showHelp ? "mb-2" : "mb-4",
            )}
          />
          {showHelp && (
            <p id={HELP_ID} className="text-muted mb-4 text-xs">
              {labels.disabledHelp}
            </p>
          )}
          <SubmitButton
            variant="danger"
            size="default"
            showArrow={false}
            pendingText={labels.pending}
            disabled={locked}
          >
            {labels.confirm}
          </SubmitButton>
          {demo && <InfoAlert className="mt-[18px]">{labels.demoNote}</InfoAlert>}
        </form>
      </DialogContent>
    </Dialog>
  );
}
