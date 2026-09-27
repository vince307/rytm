# Review follow-ups — `merchant-patterns`

From `reviews/impl-review.md` (2026-09-27). Symbols, not line numbers.

- [ ] **F2 — keyset paging in `loadPatterns` / `collectPages`** (`src/lib/patterns/load.ts`): replace offset
      `.range()` with `.gt("id", lastId).order("id").limit(PAGE_SIZE)`, request `count` on the first page only, stop on an
      empty page; bound the loop. Removes the offset-shift class (F1 is patched by failing the read) and the per-page
      `COUNT(*)`. Trigger: S-02 undo-import landing, or any observed `patterns read ended short of count` log.
- [ ] **F3 — tests** (`test/unit/patterns.test.ts`): standalone `S.C.A` and `http://` cases for `normalizeMerchant`.
- [ ] **F5/F6/F7 — tidy**: single `columns.slice(0, 4)` in `src/pages/patterns.astro`; log `code`/`message` in the
      `/patterns` error branch; share the kit icon-size union between `Glyph` and `Icon.astro`.
