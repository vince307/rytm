# Rytm — Oś

**Spokojna kontrola. Wyraźna struktura.**

Sygnet wychodzi bezpośrednio z litery R. Mocny pion stabilizuje kompozycję, a powtarzające się skosy 45° nadają jej rytm. Znak jest płaski, jednokolorowy i zachowuje konstrukcję wybranego projektu „Oś”.

## Paleta

| Rola | HEX | Zastosowanie |
| --- | --- | --- |
| Granat | `#202F40` | Logo, tekst podstawowy, ciemne powierzchnie |
| Ciepła biel | `#F2F1EC` | Główne jasne tło, jasny znak na granacie |
| Bursztyn | `#C79D62` | Graficzne oznaczenie nadwyżki, akcent na ciemnym tle |
| Ciemny bursztyn | `#7E5726` | Mały tekst o nadwyżce na jasnym tle |
| Szaroniebieski | `#606E7C` | Tekst pomocniczy na jasnym tle |
| Jasnoszary | `#CED3D5` | Linie podziału i dekoracyjne elementy pustego stanu |
| Czerń / biel | `#000000` / `#FFFFFF` | Warianty monochromatyczne |

Granat na ciepłej bieli ma kontrast około **12,04:1**. Bursztyn na tym samym tle ma **2,20:1**: używaj go dekoracyjnie, nie do małego tekstu ani jako jedynego nośnika informacji. Dla tekstu o nadwyżce stosuj ciemny bursztyn (**5,66:1**); na granacie podstawowy bursztyn osiąga **5,47:1**. W interfejsie oznaczenie nadwyżki powinno mieć także etykietę lub wartość.

## Typografia

**Manrope** — darmowy krój z Google Fonts, z polskimi znakami, na licencji SIL Open Font License 1.1. Plik zmienny i licencja są dołączone do paczki.

- Wordmark: Manrope **750**, odstęp między literami **0,012 em**; używaj gotowego SVG, aby zachować proporcje.
- Nagłówki aplikacji: Manrope **700**.
- Tekst interfejsu: Manrope **450–500**.
- Zdanie na grafice OG: Manrope **500**.

Wszystkie napisy w dostarczonych grafikach SVG są zamienione na ścieżki: ich wyświetlenie nie wymaga instalowania fontu. Nie zastępuj litery R w wordmarku sygnetem — znak stoi obok całej nazwy „Rytm”.

Źródło: [Google Fonts — Manrope](https://fonts.google.com/specimen/Manrope). Font pobrano z [repozytorium Google Fonts](https://github.com/google/fonts/tree/main/ofl/manrope).

## Pole ochronne i rozmiary

**x = grubość pionu sygnetu.** Minimalne pole ochronne z każdej strony sygnetu lub całego logo wynosi **1x**. Licz je od skrajnej widocznej krawędzi, również od dolnej części litery „y”. W gotowych plikach logo i sygnetu pozostawiono wymagany margines.

| Element | Minimum cyfrowe |
| --- | --- |
| Logo poziome | **145 px szerokości pliku**; ok. 26 px wysokości widocznego sygnetu |
| Sygnet standardowy | **24 px wysokości widocznego znaku**; ok. 36 px wysokości pliku z polem ochronnym |
| Favicon | **16 × 16 px**, wyłącznie dedykowana wersja optyczna |
| Ikona aplikacji | Plik źródłowy **1024 × 1024 px**, promień narożników **224 px** |

Zachowuj proporcje plików. Nie dodawaj obrysu, cienia, gradientu ani dodatkowego okręgu. Nie ściskaj litery i nie zmieniaj kątów. Favicon stanowi wyjątek od standardowego pola ochronnego; ma własne marginesy i powiększony otwór wewnętrzny.

## Geometria znaku

Siatka robocza ma 32 × 32 jednostki. Widoczny znak zajmuje **23 × 26 jednostek** (x: 5–28, y: 3–29); pion ma szerokość **6 jednostek**, a ukośne krawędzie biegną pod kątem 45°. Otwór wewnętrzny powstaje przez `fill-rule="evenodd"`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -3 35 38">
  <path fill="#202F40" fill-rule="evenodd"
    d="M5 29 V3 H18 L27 12 L19 20 L28 29 H20 L11 20 V29 Z
       M11 8 V16 H16 L20 12 L16 8 Z"/>
</svg>
```

## Zastosowania

Na jasnym tle stosuj logo granatowe, na ciemnym — białe. Ikona jasna ma kremowy zaokrąglony kwadrat i granatowe R; ciemna ma granatowy kwadrat i kremowe R. Narożniki poza kwadratem są przezroczyste.

Motyw pomocniczy powtarza skos z nogi R. Bursztyn pojawia się po granicy nadwyżki. Pusty stan pokazuje dokument i regularną sekwencję elementów prowadzącą do miejsca importu; pozostaje neutralny, bez sugerowania nadwyżki przed wgraniem danych.

Grafika OG: **1200 × 630 px**, zdanie „Zobacz, gdzie cicho ucieka pieniądz.”. Ilustracja pustego stanu: **640 × 360 px**, wariant jasny i ciemny, bez tekstu.
