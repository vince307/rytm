# Follow-ups z przeglądu implementacji — `ing-csv-import`

Źródło: `reviews/impl-review.md` (2026-09-25). F1–F7 naprawione w tej zmianie; poniżej ustalenia odłożone.

## F8 — limity długości tekstów w bazie (do S-03)

- **Gdzie**: `public.imports.account_name`, `public.transactions.counterparty` / `title` / `details` (tabele z `20260923165530_domain_imports_transactions.sql`, zapis przez `import_ing_statement`).
- **Co**: limity 200 / 500 znaków istnieją tylko w `importPayloadSchema` (`src/lib/import/schema.ts`); bezpośrednie wywołanie RPC/PostgREST przez zalogowanego użytkownika może zapisać dłuższe wartości we własnych wierszach.
- **Propozycja**: nowa migracja z `check (char_length(...) <= N)` na tych kolumnach, razem z S-03 (normalizacja sprzedawcy dotyka tych samych kolumn) + asercja pgTAP.

## F9 — wspólny komponent ikony dla wysp React (przy S-02/S-03)

- **Gdzie**: `Glyph` w `src/components/imports/ImportWizard.tsx`, inline `<svg><use href="/rytm/icons/ui/ui.svg#…">` w `src/components/auth/ServerError.tsx` i `src/components/ui/dialog.tsx`.
- **Co**: trzy kopie tego samego markupu sprite'a; `Icon.astro` nie działa w wyspach.
- **Propozycja**: wydzielić `src/components/Icon.tsx` (API jak `Icon.astro`: `name`, `size`, `class`) przy następnej wyspie z ikonami i podmienić trzy miejsca.
