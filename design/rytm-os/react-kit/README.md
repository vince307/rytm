# Rytm — React handoff

Ten katalog zawiera minimalny zestaw do odtworzenia strony Rytm w React, Next.js, Vite lub innym frameworku.

## Co jest tutaj

- `assets/brand/` — poziome logo i sam sygnet: granat, czerń, biel, SVG.
- `assets/icons/` — ikona aplikacji 1024 × 1024 na jasne i ciemne tło.
- `assets/favicon/` — automatyczny SVG, ICO oraz warianty PNG 16/32 px.
- `assets/illustrations/` — ilustracja pustego stanu w dwóch wariantach.
- `assets/social/` — grafika Open Graph 1200 × 630.
- `assets/icons/ui/` — liniowy sprite ikon 16/20 px: przegląd, wzorce, koszty stałe, import, konto, upload, scalanie, zmiana typu, wykluczenie, edycja, szukanie, sortowanie, zamknięcie, strzałki, ostrzeżenie, sukces i info.
- `assets/fonts/` — Manrope Variable i licencja OFL.
- `styles/brand.css` — font-face, tokeny kolorów i podstawowa geometria znaku.
- `docs/content.json` — wszystkie teksty widoków jako dane do komponentów.
- `docs/routes.md` — mapa wszystkich tras, w tym dashboardu, wzorców, kosztów stałych, importu i ustawień.
- `docs/asset-map.json` — referencje do plików dla bundlera.
- `prototype/` — klikalny prototyp HTML, style, skrypty i osobne strony podglądowe dla wszystkich stanów.

## Szybkie użycie

Skopiuj `assets/` i `styles/` do `src/assets/` albo `public/`, zależnie od frameworka. W React importuj SVG jako URL lub komponent, a `content.json` użyj jako źródła tekstów dla stron. `brand.css` zaimportuj przed stylami komponentów.

Przykład:

```tsx
import logo from "./assets/brand/rytm-logo-granat.svg";
import copy from "./docs/content.json";

export function Header() {
  return <img src={logo} alt={copy.brand.name} />;
}
```

Teksty, które pojawiają się na stronie, są zebrane w `docs/content.json`, więc komponenty mogą być pozbawione twardo zakodowanego copy. Standardowo używaj SVG; PNG zachowaj jako fallbacki i eksporty do systemów, które nie obsługują wektorów.

## Runda 2

Dodano stany auth (`#/reset/new`, `#/confirm-email`), puste widoki przed pierwszym importem, błędy importu, sekcję wykluczonych wzorców i reguły mobile 320–560 px. Prototypowe pliki HTML znajdują się w głównym eksporcie `rytm-os-views-html.zip`.


## Runda 3

Dodano stany auth i ustawień, obsługę koncepcyjną dwóch banków, warianty błędów importu, przypadki brzegowe wzorców, koszty stałe, wykres i demo. Szczegóły decyzji i tras są w `docs/routes.md` oraz repozytoryjnym `CHANGELOG.md`. Prototyp uruchom przez lokalny serwer HTTP; instrukcja jest w `prototype/README.md`.
