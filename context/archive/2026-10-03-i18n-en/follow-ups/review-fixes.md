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

## From `/10x-impl-review` (2026-10-03)

- [x] **F1 `getMonths` EN nominative was Polish** — `src/content/copy.ts` `getMonths` read `Object.keys(monthNames)`
      for every locale; EN keys are Polish, so `/home` lead said "Your wrzesień…". Fixed `1dbab76` + unit case.
      Trigger: n/a (closed)
- [ ] **F2 No `Vary` / `Cache-Control: private` on locale-varying HTML** — `src/middleware.ts` `onRequest` resolves the
      locale from cookie + `Accept-Language`, but responses carry no `Vary: Cookie, Accept-Language`. Harmless today
      (Vercel does not edge-cache SSR responses, no `s-maxage`, no prerendered page).
      Trigger: any slice adding `Cache-Control` / `s-maxage` / ISR / `prerender = true` on a page, or a CDN in front of Vercel
- [ ] **F3 EN imports store English default account names** — `importFlow.accountDefaultING` /
      `copyExtra.imports.santanderAccountName` are locale-dependent, so an import made in EN saves "Main account" in
      the DB and shows it in PL later. Data, user-editable; accepted for now.
      Trigger: owner reports mixed-language account names, or a slice touching account naming
- [ ] **F4 EN spelling "e-mail" (kit.ts) vs "email" (extra.ts)** — `kitEn.auth.fields.email`, `kitEn.authStates.*`
      vs `extraEn.auth.confirmEmailVisual.lead`, `extraEn.auth.confirmedLogin`. Cosmetic.
      Trigger: `[human]` row 7.10 translation review, or EN copy replacement (K42)
