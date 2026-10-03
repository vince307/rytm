# Follow-ups — i18n-en (S-16)

Each item carries a `Trigger:` line; later slices grep for it.

- [x] **`AuthLayout` visual title weight** — the bilingual-era title now `font-bold` like the kit's `.auth-visual h2`.
      Closed in P6 (`570cf20`).
      Trigger: n/a (closed)
- [x] **Landing steps head below 560 px** — stacks (`max-[559px]:flex-col`). Closed in P6 (`570cf20`).
      Trigger: n/a (closed)
- [ ] **`PanelTitle` sweep** — the settings Panel title and the switch share a row by hand; a shared `PanelTitle.astro`
      would serve four views, out of scope for an i18n change.
      Trigger: global panel / PanelTitle pass (kit round 4 or maintainer preference)
- [ ] **S-14 F7 — `FormField.tsx` / `DeleteAccountDialog.tsx` keep their own 8 px box** instead of `fieldBox`.
      Trigger: next slice touching auth or settings forms
- [ ] **E2E setup** — no Playwright in the repo; smoke + unit + visual gate carried this slice (autonomous decision 14).
      Trigger: hydration mismatch seen in an EN island, or the next slice adding a browser-only risk
- [ ] **EN copy replacement** — `src/content/en/kit.ts` and `en/extra.ts` are own translations, not kit copy.
      Trigger: kit ships EN copy (K42)
- [ ] **K42–K44 to the kit author** — no EN copy, no language switcher, no key for the landing mock-up amount.
      Trigger: kit round 4
