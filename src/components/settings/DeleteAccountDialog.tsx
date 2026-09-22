import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ServerError } from "@/components/auth/ServerError";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { DELETE_CONFIRM_WORD } from "@/lib/auth-rules";

export interface DeleteAccountLabels {
  trigger: string;
  eyebrow: string;
  title: string;
  body: string;
  confirmationHint: string;
  placeholder: string;
  confirm: string;
  pending: string;
  close: string;
}

interface Props {
  labels: DeleteAccountLabels;
  serverError?: string | null;
}

const HINT_ID = "delete-account-hint";

export default function DeleteAccountDialog({ labels, serverError }: Props) {
  // A failed deletion comes back as ?error=delete — reopen the dialog on the error it belongs to.
  const [open, setOpen] = useState(Boolean(serverError));
  const [confirmation, setConfirmation] = useState("");
  const hint = labels.confirmationHint.split(DELETE_CONFIRM_WORD);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="danger">{labels.trigger}</Button>
      </DialogTrigger>
      <DialogContent closeLabel={labels.close}>
        <div className="text-excess-text text-xs font-extrabold tracking-[0.14em] uppercase">{labels.eyebrow}</div>
        <DialogTitle>{labels.title}</DialogTitle>
        <DialogDescription id={HINT_ID}>
          {labels.body} {hint[0]}
          {hint.length > 1 && (
            <>
              <strong className="font-bold">{DELETE_CONFIRM_WORD}</strong>
              {hint[1]}
            </>
          )}
        </DialogDescription>
        <form method="POST" action="/api/auth/delete" className="mt-[18px]">
          <ServerError message={serverError} />
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
            aria-describedby={HINT_ID}
            placeholder={labels.placeholder}
            className="border-line text-ink placeholder:text-muted/70 focus:border-ink focus:ring-ink/8 mb-4 w-full rounded-lg border bg-white p-[13px] transition-colors outline-none focus:ring-[3px]"
          />
          <SubmitButton
            variant="danger"
            size="default"
            showArrow={false}
            pendingText={labels.pending}
            disabled={confirmation.trim() !== DELETE_CONFIRM_WORD}
          >
            {labels.confirm}
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
