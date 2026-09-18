# Rytm — React handoff

Ten katalog zawiera minimalny zestaw do odtworzenia strony Rytm w React, Next.js, Vite lub innym frameworku.

## Co jest tutaj

- `assets/brand/` — poziome logo i sam sygnet: granat, czerń, biel, SVG.
- `assets/icons/` — ikona aplikacji 1024 × 1024 na jasne i ciemne tło.
- `assets/favicon/` — automatyczny SVG, ICO oraz warianty PNG 16/32 px.
- `assets/illustrations/` — ilustracja pustego stanu w dwóch wariantach.
- `assets/social/` — grafika Open Graph 1200 × 630.
- `assets/fonts/` — Manrope Variable i licencja OFL.
- `styles/brand.css` — font-face, tokeny kolorów i podstawowa geometria znaku.
- `docs/content.json` — wszystkie teksty widoków jako dane do komponentów.
- `docs/routes.md` — mapa tras.
- `docs/asset-map.json` — referencje do plików dla bundlera.

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
