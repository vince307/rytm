# Rytm — Oś / pakiet identyfikacji

Gotowe pliki wektorowe SVG i rastrowe PNG. Wszystkie fonty w grafikach zamieniono na ścieżki.

| Katalog | Zawartość |
| --- | --- |
| `sygnet/` | Sam znak: granatowy, czarny, biały; PNG 700 × 760 i skalowalne SVG, z polem ochronnym |
| `logo/` | Logo poziome: granatowe, czarne, białe; PNG 1160 × 432 i SVG |
| `ikony/` | Ikona aplikacji 1024 × 1024: jasna i ciemna; SVG i PNG z przezroczystymi narożnikami |
| `favicon/` | Wersja optyczna 16 × 16 i 32 × 32: granatowa i biała; SVG, PNG, wielorozmiarowy ICO oraz automatyczny SVG light/dark |
| `og/` | Grafika Open Graph 1200 × 630, SVG i PNG |
| `ilustracje/` | Pusty stan 640 × 360 na jasne i ciemne tło; SVG i przezroczyste PNG |
| `fonty/` | Manrope Variable i licencja OFL |
| `dokumentacja/` | Krótka karta stylu z geometrią znaku i tokeny CSS |
| `rytm-os-podglad.*` | Plansza poglądowa całej identyfikacji |

Logo, sygnety, favicony i ilustracje PNG mają przezroczyste tło. Białe pliki oglądaj na ciemnej powierzchni. Grafika OG i plansza poglądowa mają pełne tło.

## Użycie w aplikacji

W pierwszej kolejności używaj SVG; PNG są eksportami pomocniczymi. Faviconów nie twórz przez zmniejszenie standardowego sygnetu — użyj plików z katalogu `favicon/`.

```html
<link rel="icon" href="/assets/rytm/favicon/favicon.svg" type="image/svg+xml">
<link rel="alternate icon" href="/assets/rytm/favicon/favicon.ico">
```

Przenieś katalog do własnych zasobów lub dopasuj ścieżki. Plik `favicon.svg` reaguje na ustawienie jasnego/ciemnego motywu systemu; warianty PNG pozostają stałe.

```css
@font-face {
  font-family: "Manrope";
  src: url("/assets/rytm/fonty/Manrope-Variable.ttf") format("truetype");
  font-weight: 200 800;
  font-style: normal;
  font-display: swap;
}
```

Pełne zasady kolorów, pola ochronnego i rozmiarów są w [karcie stylu](dokumentacja/karta-stylu.md).
