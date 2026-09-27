# Review fixes — `pattern-threshold-over-limit` (S-04)

Queued by `/10x-impl-review` (2026-09-27, `reviews/impl-review.md`). None of these blocks a merge.

## F3 — One shared focus-ring / focus-within class (WARNING)

- **Where**: the literal `outline-none focus-visible:ring-[3px] focus-visible:ring-ink/15` is repeated in three
  places:
  - `src/components/ui/button.tsx` `buttonVariants`
  - `src/components/app/BackLink.astro`
  - `src/components/patterns/PatternsTable.tsx` `focusRing`

  `src/components/patterns/ThresholdEditor.tsx` (input-suffix wrapper) also re-types the `field` focus-within ring
  from `src/components/app/field-styles.ts`.
- **Fix**: export `focusRing` / `fieldFocusWithin` from `field-styles.ts` and import it at every call site. Then
  take a screenshot of each touched view.
- Trigger: the next change that alters the focus ring or the `ink` token, or an accessibility pass. Whichever
  comes first.

## F4 — Save/delete with a usable key but an invalid form lands silently on `/patterns` (WARNING)

- **Where**:
  - `src/pages/api/patterns/threshold.ts` `POST` and `src/pages/api/patterns/threshold/delete.ts` `POST`: any
    `safeParse` failure redirects to `/patterns`.
  - `src/lib/patterns/threshold-form.ts` `thresholdSaveSchema`: `key` is capped at 500 characters, while
    `transactions.counterparty` is not.
- **Fix**: parse `key` first. When the key is usable but the rest of the form fails, redirect to
  `thresholdRedirect(key, "error-value", month)`. Hide or disable the editor on the detail page for keys longer
  than 500 characters, and add unit cases.
- Trigger: a merchant key longer than 500 characters seen in real data, or a user report of a save that
  "did nothing".

## F5 — `loadThresholds` has no paging (OBSERVATION, plan Known risk)

- **Where**: `src/lib/patterns/thresholds.ts` `loadThresholds`.
- **Fix**: page it through `collectPages` (keyset). Alternatively, reject save keys that are not among the
  caller's derived patterns.
- Trigger: any account with more than 500 threshold rows, or S-05 adding its own per-merchant table (reuse the
  paging there).

## F8 — Editor pending state can stick after bfcache back-navigation (OBSERVATION)

- **Where**: `src/components/patterns/ThresholdEditor.tsx`, the `saving` state (it is never reset).
- **Fix**: reset `saving` on `pageshow` when `event.persisted` is true.
- Trigger: the visual step (or a user) reproduces a disabled „Zapisywanie…” button after going Back.

## F11 — App-wide `rounded-lg` (14px) vs the kit's 8px fields (OBSERVATION, visual gate 2026-09-27)

- **Where**: `src/styles/global.css` `--radius` (14px → `rounded-lg`), used by `src/components/app/field-styles.ts`
  `field` (so `/patterns` toolbar and `MonthSelect`), `src/components/auth/FormField.tsx`. The kit uses 8px for
  `.field input`, `.search-field`, `.select-field`, `.input-suffix`, `.threshold-option` (measured 2026-09-27).
- **Done here**: only `ThresholdEditor` (this slice's own component) moved to `rounded-[8px]` in `0a6973d`.
- **Fix**: a named radius token for fields (8px) and a sweep of the field components, with screenshots of every view
  that renders them.
- Trigger: the next UI change to a view with a form field, or a design-kit round that names field radii.
