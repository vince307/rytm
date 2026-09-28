import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Glyph } from "@/components/Glyph";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { usePageShowReset } from "@/components/hooks/usePageShowReset";
import type { PatternType } from "@/types";

// Kit modal('patternActions') (app.js) wired to POST /api/patterns/decision (S-05). The kit's four ghost buttons
// only fire toasts (closeModal();showToast(...)) — here "Scal z…" and "Zmień nazwę" reveal a real form (no kit
// layout for either, G33), "Zmień typ" and "Wyklucz z analizy" submit directly, one <form> per action (forms
// cannot nest — ThresholdEditor precedent). `copy` carries only the strings this dialog renders, never the
// result-line strings (`merged`, `unmerged`, …): those are asserted in smoke as bare text (plan review F1), which
// this island's serialized props would otherwise satisfy.
export interface PatternActionsCopy {
  actions: string;
  actionsEyebrow: string;
  actionsTitle: string;
  actionsLead: string;
  merge: string;
  changeType: string;
  rename: string;
  exclude: string;
  mergeLabel: string;
  mergeSubmit: string;
  mergeNone: string;
  renameLabel: string;
  renameHint: string;
  renameSubmit: string;
  saving: string;
  close: string;
}

interface Props {
  patternKey: string;
  type: PatternType;
  name: string;
  excluded: boolean;
  mergeTargets: { key: string; name: string }[];
  copy: PatternActionsCopy;
}

// Kit `.modal-actions .btn{justify-content:flex-start}`; `.modal-actions{display:grid}` already stretches its
// grid-item children to the column's full width, so no explicit `w-full` is needed on the buttons themselves.
const actionButton = "justify-start";
// Kit `.modal-input`: radius 8px, padding 13, margin 4 0 16. DESIGN-GAP: G32 — `bg-paper` not the kit's `--white`
// (ThresholdEditor precedent). The select has no kit reference (G33) — same box, no margin (labelled by a
// preceding <label>, F11: new fields use kit 8 px locally).
const fieldBox =
  "border-line bg-paper focus-within:border-ink focus-within:ring-ink/8 w-full rounded-[8px] border focus-within:ring-[3px]";

export default function PatternActionsDialog({ patternKey, type, name, excluded, mergeTargets, copy }: Props) {
  const [pending, setPending] = useState(false);
  const [revealed, setRevealed] = useState<"merge" | "rename" | null>(null);
  usePageShowReset(() => {
    setPending(false);
  });

  const otherType: PatternType = type === "fixed" ? "frequent" : "fixed";
  const canMerge = mergeTargets.length > 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost">
          <Glyph name="more" size={16} />
          <span>{copy.actions}</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        closeLabel={copy.close}
        // Not a destructive dialog by default, but opening on the dialog itself (never the first action button)
        // keeps initial focus off any single action — including "Wyklucz z analizy" — as DeleteImportDialog does.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (event.currentTarget as HTMLElement | null)?.focus();
        }}
      >
        <div className="text-excess-text text-xs font-extrabold tracking-[0.14em] uppercase">{copy.actionsEyebrow}</div>
        <DialogTitle>{copy.actionsTitle}</DialogTitle>
        <DialogDescription>{copy.actionsLead}</DialogDescription>

        <div className="mt-[22px] grid gap-2">
          <div>
            <Button
              type="button"
              variant="ghost"
              className={actionButton}
              disabled={!canMerge}
              aria-expanded={revealed === "merge"}
              onClick={() => {
                setRevealed((current) => (current === "merge" ? null : "merge"));
              }}
            >
              <Glyph name="merge" size={16} />
              <span>{copy.merge}</span>
            </Button>
            {!canMerge && <p className="text-muted mt-2 text-[13px]">{copy.mergeNone}</p>}
            {canMerge && revealed === "merge" && (
              <form
                method="POST"
                action="/api/patterns/decision"
                className="mt-2"
                onSubmit={() => {
                  setPending(true);
                }}
              >
                <input type="hidden" name="key" value={patternKey} />
                <input type="hidden" name="action" value="merge" />
                <label className="grid gap-[7px] text-xs font-bold">
                  <span>{copy.mergeLabel}</span>
                  <div className={fieldBox}>
                    <select
                      name="target"
                      required
                      className="text-ink w-full min-w-0 border-0 bg-transparent p-[13px] text-[13px] outline-none"
                    >
                      {mergeTargets.map((target) => (
                        <option key={target.key} value={target.key}>
                          {target.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
                <div className="mt-3">
                  <SubmitButton
                    variant="primary"
                    size="default"
                    showArrow={false}
                    pending={pending}
                    pendingText={copy.saving}
                  >
                    {copy.mergeSubmit}
                  </SubmitButton>
                </div>
              </form>
            )}
          </div>

          <form
            method="POST"
            action="/api/patterns/decision"
            onSubmit={() => {
              setPending(true);
            }}
          >
            <input type="hidden" name="key" value={patternKey} />
            <input type="hidden" name="action" value="type" />
            <input type="hidden" name="type" value={otherType} />
            <SubmitButton
              variant="ghost"
              size="default"
              showArrow={false}
              pending={pending}
              pendingText={copy.saving}
              className={actionButton}
            >
              <Glyph name="switch" size={16} />
              <span>{copy.changeType}</span>
            </SubmitButton>
          </form>

          <div>
            <Button
              type="button"
              variant="ghost"
              className={actionButton}
              aria-expanded={revealed === "rename"}
              onClick={() => {
                setRevealed((current) => (current === "rename" ? null : "rename"));
              }}
            >
              <Glyph name="edit" size={16} />
              <span>{copy.rename}</span>
            </Button>
            {revealed === "rename" && (
              <form
                method="POST"
                action="/api/patterns/decision"
                className="mt-2"
                onSubmit={() => {
                  setPending(true);
                }}
              >
                <input type="hidden" name="key" value={patternKey} />
                <input type="hidden" name="action" value="rename" />
                <label className="grid gap-[7px] text-xs font-bold">
                  <span>{copy.renameLabel}</span>
                  <div className={fieldBox}>
                    <input
                      name="name"
                      maxLength={100}
                      defaultValue={name}
                      className="text-ink w-full min-w-0 border-0 bg-transparent p-[13px] text-[13px] outline-none"
                    />
                  </div>
                </label>
                <p className="text-muted my-2 text-[13px] leading-[1.55]">{copy.renameHint}</p>
                <SubmitButton
                  variant="primary"
                  size="default"
                  showArrow={false}
                  pending={pending}
                  pendingText={copy.saving}
                >
                  {copy.renameSubmit}
                </SubmitButton>
              </form>
            )}
          </div>

          {!excluded && (
            <form
              method="POST"
              action="/api/patterns/decision"
              onSubmit={() => {
                setPending(true);
              }}
            >
              <input type="hidden" name="key" value={patternKey} />
              <input type="hidden" name="action" value="exclude" />
              <SubmitButton
                variant="ghost"
                size="default"
                showArrow={false}
                pending={pending}
                pendingText={copy.saving}
                className={actionButton}
              >
                <Glyph name="exclude" size={16} />
                <span>{copy.exclude}</span>
              </SubmitButton>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
