import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { usePageShowReset } from "@/components/hooks/usePageShowReset";
import { InfoAlert } from "@/components/app/InfoAlert";
import { fillTemplate } from "@/lib/import/presentation";

export interface DeleteImportLabels {
  action: string;
  eyebrow: string;
  title: string;
  body: string;
  pending: string;
  close: string;
  /** Kit `imports.demoDeleteBlocked` — shown, with the danger button disabled, for the shared demo account. */
  demoNote: string;
}

interface Props {
  id: string;
  range: string;
  describedBy: string;
  labels: DeleteImportLabels;
  /** The shared demo account (S-09): undo is always refused, so the dialog says so and disables the button. */
  demo: boolean;
}

// Kit modal('deleteImport') for one row (app.js) — one danger button, no cancel (close X / Esc / overlay).
// Modelled on DeleteAccountDialog; each row gets its own dialog+form island, mirroring the list's real buttons.
export default function DeleteImportDialog({ id, range, describedBy, labels, demo }: Props) {
  const [pending, setPending] = useState(false);
  const title = fillTemplate(labels.title, { range });
  // undo-import F4 / S-04 F8: a bfcache restore (back-navigation after the POST) must not leave the button stuck.
  usePageShowReset(() => {
    setPending(false);
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="text-danger" size="inline" aria-describedby={describedBy}>
          {labels.action}
        </Button>
      </DialogTrigger>
      <DialogContent
        closeLabel={labels.close}
        // Destructive dialog: open on the dialog itself (announced via its title), not on the danger button, so
        // Enter on the trigger followed by a stray Enter cannot delete (visual gate, WAI-ARIA APG alertdialog).
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (event.currentTarget as HTMLElement | null)?.focus();
        }}
      >
        <div className="text-excess-text text-xs font-extrabold tracking-[0.14em] uppercase">{labels.eyebrow}</div>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{labels.body}</DialogDescription>
        {demo && <InfoAlert className="mt-[18px]">{labels.demoNote}</InfoAlert>}
        <form
          method="POST"
          action="/api/imports/delete"
          className="mt-[18px]"
          onSubmit={() => {
            setPending(true);
          }}
        >
          <input type="hidden" name="id" value={id} />
          <SubmitButton
            variant="danger"
            size="default"
            showArrow={false}
            pendingText={labels.pending}
            pending={pending}
            disabled={demo}
          >
            {labels.action}
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
