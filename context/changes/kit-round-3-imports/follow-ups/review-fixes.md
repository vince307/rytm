# Review follow-ups — `kit-round-3-imports` (S-13)

Source: `reviews/impl-review.md` (2026-10-02). Later slices grep `Trigger:`.

## F3 — Result page hides an imports read error behind „not found”

- **Where**: `src/pages/imports/result.astro`, the `imported` select (only `.data` is read).
- **What**: a DB error renders the kit not-found state without a log line (pre-existing: it used to redirect).
- **Fix**: read `error` too; `console.error` it (as the count query does) and render `copy.components.error`.
- Trigger: next change touching `src/pages/imports/result.astro`, or an observability audit

## F7 — Demo-locked wizard: „Wybierz inny plik” stays enabled

- **Where**: `src/components/imports/ImportWizard.tsx`, `chooseOtherButton`.
- **What**: with `demoLocked` and a `?error=`, the button opens the picker and `handleFile` silently drops the file.
- **Fix**: `disabled={demoLocked}` on the button (or hide it when locked).
- Trigger: visual gate of kit-round-3-imports shows the button on a demo-locked error state, or S-12 (demo strip)

## F8 — Wizard `submitting` has no bfcache reset (plan Known risks)

- **Where**: `src/components/imports/ImportWizard.tsx`, `submitting` state.
- **Fix**: `usePageShowReset(() => setSubmitting(false))`, as `DeleteImportDialog` does.
- Trigger: visual gate of kit-round-3-imports reproduces a stuck „Importowanie…” after Back from `/imports/result`
