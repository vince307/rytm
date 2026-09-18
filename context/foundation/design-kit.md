---
project: "Rytm"
context_type: greenfield
created: 2026-09-18
updated: 2026-09-18
design_system: "Rytm — Oś"
kit_location: "design/rytm-os/"
kit_source: "wygenerowany 2026-09-16 z innym LLM (brand designer / ilustrator); dostarczany przez autora"
authority: kit-is-source-of-truth
gap_policy: report-do-not-invent
---

# Design kit — Rytm / Oś

## Zasada nadrzędna

**Katalog `design/rytm-os/` jest źródłem prawdy dla UI i UX.** Projekt i design rozwijają się w kierunku wyznaczonym przez ten katalog: identyfikacja (znak, paleta, typografia), copy widoków, mapa tras i layouty z prototypu.

Reguły dla każdego, kto implementuje UI (człowiek lub agent):

1. **Nie wymyślaj elementów, których nie ma w kicie.** Brakujący ekran, komponent, stan, ikona, ilustracja, tekst → **zgłoś** w sekcji „Rejestr braków” poniżej (albo w PR / rozmowie), z nazwą, kontekstem użycia i tym, co jest potrzebne. Autor generuje brakujący element i dostarcza go do `design/rytm-os/`.
2. Do czasu dostarczenia brakującego elementu wolno użyć **neutralnego placeholdera** zbudowanego wyłącznie z tokenów kitu (`brand.css`) i istniejących wzorców z prototypu — oznaczonego w kodzie komentarzem `// DESIGN-GAP: <id z rejestru>`. Placeholder nie jest decyzją projektową.
3. Kolory, font, promienie, cienie, odstępy — tylko z `react-kit/styles/brand.css` i `prototype/styles.css`. Nie dodawaj nowych kolorów ani drugiego fontu.
4. Copy widoków bierz z `react-kit/docs/content.json`. Gdy copy jest sprzeczne z kontraktem produktu (`shape-notes.md`), **kontrakt produktu wygrywa**, a rozbieżność trafia do sekcji „Konflikty” i do autora do poprawy w kicie.
5. Znak: nie modyfikuj geometrii, nie dodawaj obrysów/cieni/gradientów, favicon tylko z dedykowanych plików (karta stylu).
6. Kit jest wersjonowany w repo razem z kodem. Nowe dostawy od autora nadpisują pliki w `design/rytm-os/` w osobnym commicie „design: …”, a rejestr braków jest aktualizowany (status `delivered`).

## Zawartość `design/rytm-os/`

| Katalog | Co zawiera | Rola |
|---|---|---|
| `react-kit/` | handoff do React: `assets/` (brand SVG, ikona app, favicony, ilustracja pustego stanu, OG, font Manrope Variable + OFL), `styles/brand.css` + `rytm-tokens.css`, `docs/content.json` (copy widoków), `docs/routes.md`, `docs/asset-map.json`, `README.md` | **Główne źródło** dla implementacji — assets i tokeny kopiowane do aplikacji przy bootstrapie |
| `brand-pack/` | pakiet identyfikacji: te same SVG + eksporty PNG, plansza poglądowa, `dokumentacja/karta-stylu.md` (paleta z kontrastami, typografia, pole ochronne, geometria znaku) | Dokumentacja marki i fallbacki PNG |
| `prototype/` | `index.html` + `app.js` + `styles.css` — działający prototyp 6 widoków (vanilla JS, hash routing) | **Jedyna specyfikacja layoutu i komponentów** — wzorce CSS (`.btn`, `.stat-card`, `.panel`, `.list-item`, `.field`, `.import-panel`, siatki, breakpointy 900/560 px) do przeniesienia na komponenty |

Pominięte przy kopiowaniu: dwie identyczne kopie tego samego pakietu i pliki `.DS_Store`.

## Tożsamość w skrócie (z karty stylu)

- Hasło: **„Spokojna kontrola. Wyraźna struktura.”** Ton: bez oceniania, bez moralizowania, jeden spokojny moment w miesiącu.
- Paleta: granat `#202F40` (ink), ciepła biel `#F2F1EC` (paper), bursztyn `#C79D62` (**tylko** oznaczenie nadwyżki, dekoracyjnie — kontrast 2,20:1), ciemny bursztyn `#7E5726` (tekst o nadwyżce), szaroniebieski `#606E7C` (tekst pomocniczy), jasnoszary `#CED3D5` (linie), zieleń `#2E5C50` (w `brand.css`, bez opisanego zastosowania).
- Font: **Manrope** (variable, OFL). Nagłówki 700, UI 450–500, wordmark 750.
- Motyw: sygnet „R” z pionem i skosami 45°; powtórzony jako sekwencja elementów, bursztyn pojawia się **po granicy** (próg → nadwyżka). To jest wizualny język reguły produktu.
- Nadwyżka zawsze z etykietą lub wartością, nigdy samym kolorem (dostępność).

## Widoki i trasy w kicie

| Trasa | Widok | Stan w prototypie |
|---|---|---|
| `/` | Landing | kompletny |
| `/how-it-works` | Jak działa | kompletny |
| `/for-who` | Dla kogo | kompletny |
| `/login` | Logowanie (split: wizual + formularz) | kompletny |
| `/register` | Rejestracja | kompletny |
| `/home` | Dashboard „Przegląd miesiąca” | **szkic**: 3 stat-cardy, wykres dzienny 30 dni, lista 3 wzorców, panel importu; nawigacja boczna ma linki `Wzorce wydatków`, `Koszty stałe`, `Importy CSV`, `Ustawienia` **bez ekranów** |

## Konflikty kit ↔ kontrakt produktu (do poprawy w kicie)

| # | W kicie | W `shape-notes.md` | Rozstrzygnięcie |
|---|---|---|---|
| K1 | Etykieta **„Spalone w tym miesiącu”** (dashboard stat, landing krok 03, how-it-works krok 03) | FR-011: neutralne **„ponad próg”** / **„ponad progiem w tym miesiącu”** (decyzja z rundy Sokratesa: „spalone” to etykieta moralna) | Kontrakt wygrywa. Copy w `content.json` i prototypie do zmiany przez autora. |
| K2 | „dane zostają **na tym urządzeniu**” (panel importu), „dane zostają u Ciebie” (landing) | Dane są na serwerze za loginem; CSV nie jest przechowywany po imporcie, transakcje nie opuszczają produktu | „u Ciebie” OK; „na tym urządzeniu” jest nieprawdą — do zmiany (np. „plik nie jest przechowywany po imporcie”). |
| K3 | „co wraca co miesiąc, **tydzień lub kilka dni**” (how-it-works krok 02) | Reguła i progi są **miesięczne** | Copy do złagodzenia albo świadoma obietnica marketingowa — decyzja autora. |
| K4 | Wykres „Rytm wydatków — ostatnie 30 dni” (słupki dzienne) | FR-013: trend **per miesiąc** sumy „ponad progiem” | Potrzebny wariant wykresu miesięcznego (→ brak G6). |
| K5 | Rejestracja z polem „Imię” | FR-001 nie wymaga imienia; „Dzień dobry, Olu.” zakłada je | Zostawić opcjonalne albo usunąć — decyzja przy wyborze mechanizmu logowania (OQ #6). |
| K6 | Tokeny rozjeżdżają się między plikami: `--muted` `#606E7C` (brand.css) vs `#647180` (prototype), `--line` `#CED3D5` vs `#d6dadb`, `--paper-soft` `#E8ECEA` vs `--paper2` `#e9eceb` | — | Kanoniczny jest `react-kit/styles/brand.css`; prototyp traktować jako layout, nie jako źródło wartości kolorów. |
| K7 | Stopka „© 2025” | rok bieżący 2026 | Drobne; renderować dynamicznie. |

## Rejestr braków (gap register)

Status: `open` (do wygenerowania przez autora) · `placeholder` (tymczasowy element z tokenów, oznaczony `DESIGN-GAP`) · `delivered` (dostarczone do `design/rytm-os/`).

Pierwsza runda — porównanie kitu z 6-krokowym przepływem MVP i FR-001…FR-014:

| ID | Brakujący element | Potrzebny do | Co jest potrzebne od autora | Status |
|---|---|---|---|---|
| G1 | **Ekran „Wzorce wydatków”** (pełna lista) | krok 3, FR-007 | layout listy/tabeli: sprzedawca, typ (stały/częsty), liczba, suma, kwota dla stałych; sortowanie; stan „ponad próg”; filtr miesiąca | open |
| G2 | **Szczegół wzorca** z listą transakcji składowych | FR-008, FR-011 | layout: nagłówek wzorca + lista transakcji z oznaczeniem „ponad próg” per miesiąc | open |
| G3 | **Edytor progu** | krok 4, FR-010 | komponent: wybór rodzaju (liczba / suma / akceptowana kwota), input liczbowy, zapisz / usuń próg; stany: brak progu, ustawiony | open |
| G4 | **Akcje na wzorcu**: scal, wyklucz, zmień typ, zmień nazwę | FR-009 | menu akcji + dialog scalania (wybór drugiego wzorca) + inline rename + potwierdzenie wykluczenia | open |
| G5 | **Ekran „Koszty stałe”** | krok 6, FR-012 | lista wzorców stałych z sekcjami „podrożały” (kwota poprzednia → obecna) i „nowe w tym miesiącu” | open |
| G6 | **Wykres trendu miesięcznego** „ponad progiem” | krok 5, FR-013 | wariant istniejącego `.trend` z osią miesięcy zamiast dni; stan dla < 3 miesięcy | open |
| G7 | **Przepływ importu** (nie tylko przycisk) | krok 2, FR-003, D1/D7 z `import-formats.md` | kroki: wybór pliku → wykryty format i rachunki (wybór jednego) → podsumowanie zakresu i liczby → potwierdź; stan „przetwarzanie” (postęp) | open |
| G8 | **Błędy importu** | FR-003, FR-005 | komunikaty: nieznany format, waluta ≠ PLN, nakładający się zakres (z zakresem istniejącego importu), pusty plik | open |
| G9 | **Ekran „Importy CSV”** + cofnięcie importu | FR-004 | lista importów (data, zakres, liczba, rachunek) + akcja usuń z potwierdzeniem | open |
| G10 | **Pusty stan dashboardu** (przed pierwszym importem) | krok 2 | kompozycja z istniejącą ilustracją `rytm-pusty-stan-*.svg` + CTA „Wgraj CSV”; ilustracja jest, brak layoutu ekranu | open |
| G11 | **Ustawienia / konto** | NFR prawo do usunięcia | ekran: e-mail, wylogowanie, **usuń konto** (destrukcyjne, z potwierdzeniem) | open |
| G12 | **Nawigacja mobilna** | NFR urządzenia | sidebar znika < 900 px; klasa `.mobile-only` istnieje, ale nie ma zamiennika (dolny pasek / hamburger) | open |
| G13 | **Zestaw ikon** | nawigacja, akcje | `.side-icon` to pusty kwadrat-placeholder; potrzebne ikony: przegląd, wzorce, koszty stałe, importy, ustawienia, plus akcje (scal, wyklucz, edytuj, usuń, wgraj) | open |
| G14 | **Komponenty ogólne** nieobecne w prototypie | wszędzie | badge/tag (typ wzorca, „ponad próg”), modal/dialog, toast/alert (sukces, błąd), select/dropdown, tabs, tabela z nagłówkiem, pagination lub „pokaż więcej”, skeleton/loading, walidacja pól formularza (stan błędu) | open |
| G15 | **Tryb ciemny** | opcjonalnie | `favicon.svg` i ikona app mają warianty jasny/ciemny; brak palety ciemnej dla UI aplikacji — decyzja: MVP tylko jasny? | open (decyzja) |
| G16 | **Stany formularzy auth** | FR-001 | błąd logowania, e-mail zajęty, reset hasła (link „Nie pamiętam hasła” prowadzi donikąd) | open |

Reguła utrzymania: nowy brak wykryty podczas implementacji dostaje kolejny numer `G17…`, wpis w tej tabeli i (jeśli użyto placeholdera) komentarz `DESIGN-GAP: Gn` w kodzie. Autor po dostarczeniu zmienia status na `delivered` i wskazuje pliki.

## Jak kit wchodzi do aplikacji (dla `/10x-bootstrapper` i dalej)

- `react-kit/assets/` → `public/rytm/` (fonty, favicony, OG, ilustracje) lub import przez bundler dla SVG używanych jako komponenty.
- `react-kit/styles/brand.css` → importowany **przed** stylami komponentów; tokeny `--rytm-*` są jedynym źródłem kolorów.
- `react-kit/docs/content.json` → moduł copy (i18n-ready, ale tylko `pl`).
- `prototype/styles.css` → wzorzec do przepisania na komponenty (nie kopiować 1:1; prototyp ma własne, rozjechane tokeny — K6).
- Trasy aplikacji po zalogowaniu (`/home`, `/patterns`, `/fixed`, `/imports`, `/settings`) — nazwy dla G1/G5/G9/G11 do potwierdzenia z autorem; kit definiuje tylko `/home`.
