import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SubmitButton } from "@/components/auth/SubmitButton";

export interface DeleteImportLabels {
  action: string;
  eyebrow: string;
  title: string;
  body: string;
  pending: string;
  close: string;
}

interface Props {
  id: string;
  range: string;
  describedBy: string;
  labels: DeleteImportLabels;
}

// Kit modal('deleteImport') for one row (app.js) — one danger button, no cancel (close X / Esc / overlay).
// Modelled on DeleteAccountDialog; each row gets its own dialog+form island, mirroring the list's real buttons.
export default function DeleteImportDialog({ id, range, describedBy, labels }: Props) {
  const [pending, setPending] = useState(false);
  const title = labels.title.replace("{range}", range);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="text-danger" size="inline" aria-describedby={describedBy}>
          {labels.action}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={labels.close}>
        <div className="text-excess-text text-xs font-extrabold tracking-[0.14em] uppercase">{labels.eyebrow}</div>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{labels.body}</DialogDescription>
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
          >
            {labels.action}
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
