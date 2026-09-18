---
project: "Rytm"
context_type: greenfield
created: 2026-09-18
updated: 2026-09-18
kit_round: 1
kit_changelog: "design/rytm-os/CHANGELOG.md"
design_system: "Rytm — Oś"
kit_location: "design/rytm-os/"
kit_source: "wygenerowany 2026-09-16 z innym LLM (brand designer / ilustrator); dostarczany przez autora; runda 1 braków dostarczona 2026-09-18"
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
| `react-kit/` | handoff do React: `assets/` (brand SVG, ikona app, favicony, ilustracja pustego stanu, OG, font Manrope Variable + OFL, **`icons/ui/ui.svg` — sprite 19 ikon liniowych 16/20 px**), `styles/brand.css` (tokeny + **klasy `.rytm-badge--*` i `.rytm-icon`**) + `rytm-tokens.css`, `docs/content.json` (copy widoków, 103 klucze), `docs/routes.md` (18 tras), `docs/asset-map.json`, `README.md` | **Główne źródło** dla implementacji — assets i tokeny kopiowane do aplikacji przy bootstrapie |
| `brand-pack/` | pakiet identyfikacji: te same SVG + eksporty PNG, plansza poglądowa, `dokumentacja/karta-stylu.md` (paleta z kontrastami, typografia, pole ochronne, geometria znaku) | Dokumentacja marki i fallbacki PNG |
| `prototype/` | `index.html` + `app.js` + `styles.css` + `assets/` — działający prototyp **20 widoków** (vanilla JS, hash routing); `views/*.html` — te same widoki jako osobne pliki (wymagają `../styles.css`, `../app.js`, `../assets/`) | **Jedyna specyfikacja layoutu i komponentów** — wzorce CSS (`.btn`, `.stat-card`, `.panel`, `.list-item`, `.field`, `.import-panel`, `.badge`, `.table-panel`, `.threshold-*`, `.import-flow`, `.modal`, `.toast`, `.mobile-nav`, siatki, breakpointy 900/560 px) do przeniesienia na komponenty |
| `CHANGELOG.md` | dziennik dostaw od autora (runda 1: A1–A7, nowe widoki, świadome pominięcia) | Historia kitu |

Pominięte przy kopiowaniu: identyczne duplikaty pakietów w dostawie, pliki `.DS_Store` oraz (decyzja 2026-09-18) 9 plansz eksploracji logo z pierwszej sesji — archiwum procesu, nie kit.

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
| `/home` | Dashboard „Przegląd miesiąca” | kompletny (runda 1): 3 stat-cardy, **trend miesięczny „ponad progiem”** z częściowym miesiącem, lista wzorców, panel importu |
| `/home-empty` | Pusty dashboard przed pierwszym importem | kompletny (runda 1, G10) |
| `/patterns` | Wzorce wydatków — tabela, badge'e, szukaj, sortuj | kompletny (runda 1, G1) |
| `/patterns/:id` | Szczegół wzorca — sekwencja „R”, transakcje, edytor progu, akcje | kompletny (runda 1, G2/G3/G4) |
| `/fixed` | Koszty stałe — zmieniły kwotę / nowe / bez zmian | kompletny (runda 1, G5) |
| `/imports` | Historia importów + usuń import | kompletny (runda 1, G9) |
| `/imports/new`, `/imports/new/account`, `/imports/new/summary`, `/imports/result` | Przepływ importu: plik → rachunek → podsumowanie → wynik | kompletny (runda 1, G7), **ale krok „summary” łamie FR-005 — patrz K8** |
| `/settings` | Ustawienia / konto, usunięcie konta | kompletny (runda 1, G11) |
| `/reset` | Reset hasła + „sprawdź skrzynkę” | kompletny (runda 1, G16 częściowo) |
| `/components` | Biblioteka UI: badge'e, alerty, formularze, skeleton, dialog | kompletny (runda 1, G14 częściowo) |

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

Runda 1 (2026-09-18): K1–K4, K6, K7 **naprawione** w kicie (zweryfikowane grepem po `prototype/`: brak „spalon”, „na tym urządzeniu”, „kilka dni”, wykresu 30 dni; tokeny `--rytm-*`; `getFullYear()`). K5 naprawione połowicznie — pole imienia opcjonalne, ale powitanie „Dzień dobry, Olu.” nadal bez wariantu bez imienia (→ runda 2).

Nowe konflikty wykryte w dostawie rundy 1:

| # | W kicie | W kontrakcie (`prd.md`) | Rozstrzygnięcie |
|---|---|---|---|
| K8 | Krok `/imports/new/summary`: nachodzący zakres pokazany jako **info** („Zakres nachodzi na istniejący import z maja. Po potwierdzeniu dane nie będą automatycznie deduplikowane.”), a przycisk „Importuj 64 obciążenia” pozostaje aktywny | **FR-005: import z nachodzącym zakresem jest odrzucany**; nie ma potwierdzania ani deduplikacji | Kontrakt wygrywa. W implementacji: stan błędu blokujący (alert `error`), zakres istniejącego importu + link do niego, brak przycisku importu. Copy w kicie do poprawy przez autora (→ runda 2). |
| K9 | `prototype/styles.css`: `.badge.new` szaroniebieski (`#e2e7ec`) | `brand.css` i karta stylu: „nowy” i „zmiana kwoty” w delikatnym bursztynie (`.rytm-badge--new`) | Kanoniczny jest `brand.css`; w prototypie do poprawy. |
| K10 | Zdanie „dane nie będą automatycznie deduplikowane” sugeruje deduplikację jako opcję | Deduplikacji nie ma w produkcie (FR-005) | Usunąć razem z K8. |

## Rejestr braków (gap register)

Status: `open` (do wygenerowania przez autora) · `placeholder` (tymczasowy element z tokenów, oznaczony `DESIGN-GAP`) · `delivered` (dostarczone do `design/rytm-os/`).

Pierwsza runda — porównanie kitu z 6-krokowym przepływem MVP i FR-001…FR-014:

| ID | Brakujący element | Potrzebny do | Co jest potrzebne od autora | Status |
|---|---|---|---|---|
| G1 | **Ekran „Wzorce wydatków”** (pełna lista) | krok 3, FR-007 | layout listy/tabeli: sprzedawca, typ (stały/częsty), liczba, suma, kwota dla stałych; sortowanie; stan „ponad próg”; filtr miesiąca | delivered · `/patterns` |
| G2 | **Szczegół wzorca** z listą transakcji składowych | FR-008, FR-011 | layout: nagłówek wzorca + lista transakcji z oznaczeniem „ponad próg” per miesiąc | delivered · `/patterns/:id` |
| G3 | **Edytor progu** | krok 4, FR-010 | komponent: wybór rodzaju (liczba / suma / akceptowana kwota), input liczbowy, zapisz / usuń próg; stany: brak progu, ustawiony | delivered · `.threshold-*` w szczególe wzorca |
| G4 | **Akcje na wzorcu**: scal, wyklucz, zmień typ, zmień nazwę | FR-009 | menu akcji + dialog scalania (wybór drugiego wzorca) + inline rename + potwierdzenie wykluczenia | delivered częściowo · 4 akcje + dialog; **brak „Przywróć”** dla wykluczonego (→ runda 2) |
| G5 | **Ekran „Koszty stałe”** | krok 6, FR-012 | lista wzorców stałych z sekcjami „podrożały” (kwota poprzednia → obecna) i „nowe w tym miesiącu” | delivered · `/fixed` |
| G6 | **Wykres trendu miesięcznego** „ponad progiem” | krok 5, FR-013 | wariant istniejącego `.trend` z osią miesięcy zamiast dni; stan dla < 3 miesięcy | delivered · `.monthly-trend` (legenda, częściowy miesiąc, stan < 3 mies.) |
| G7 | **Przepływ importu** (nie tylko przycisk) | krok 2, FR-003, D1/D7 z `import-formats.md` | kroki: wybór pliku → wykryty format i rachunki (wybór jednego) → podsumowanie zakresu i liczby → potwierdź; stan „przetwarzanie” (postęp) | delivered · `/imports/new` → `/account` → `/summary` → `/result`; **K8 do poprawy** |
| G8 | **Błędy importu** | FR-003, FR-005 | komunikaty: nieznany format, waluta ≠ PLN, nakładający się zakres (z zakresem istniejącego importu), pusty plik | delivered częściowo · tylko nachodzący zakres (i to jako info — K8); **brak**: nieznany format, waluta ≠ PLN, pusty plik / brak obciążeń (→ runda 2) |
| G9 | **Ekran „Importy CSV”** + cofnięcie importu | FR-004 | lista importów (data, zakres, liczba, rachunek) + akcja usuń z potwierdzeniem | delivered · `/imports` |
| G10 | **Pusty stan dashboardu** (przed pierwszym importem) | krok 2 | kompozycja z istniejącą ilustracją `rytm-pusty-stan-*.svg` + CTA „Wgraj CSV”; ilustracja jest, brak layoutu ekranu | delivered · `/home-empty` |
| G11 | **Ustawienia / konto** | NFR prawo do usunięcia | ekran: e-mail, wylogowanie, **usuń konto** (destrukcyjne, z potwierdzeniem) | delivered · `/settings`, dialog „USUŃ” |
| G12 | **Nawigacja mobilna** | NFR urządzenia | sidebar znika < 900 px; klasa `.mobile-only` istnieje, ale nie ma zamiennika (dolny pasek / hamburger) | delivered · `.mobile-nav` (dolny pasek < 900 px) |
| G13 | **Zestaw ikon** | nawigacja, akcje | `.side-icon` to pusty kwadrat-placeholder; potrzebne ikony: przegląd, wzorce, koszty stałe, importy, ustawienia, plus akcje (scal, wyklucz, edytuj, usuń, wgraj) | delivered · `react-kit/assets/icons/ui/ui.svg` (19 symboli, obrys 1,8 px) |
| G14 | **Komponenty ogólne** nieobecne w prototypie | wszędzie | badge/tag (typ wzorca, „ponad próg”), modal/dialog, toast/alert (sukces, błąd), select/dropdown, tabs, tabela z nagłówkiem, pagination lub „pokaż więcej”, skeleton/loading, walidacja pól formularza (stan błędu) | delivered częściowo · badge, modal (wariant destrukcyjny), toast, alert, select, tabela z sortowaniem, „Pokaż więcej”, skeleton, błąd pola; **brak `tabs`**; paginacja świadomie odłożona (→ runda 2 tylko jeśli potrzebne) |
| G15 | **Tryb ciemny** | opcjonalnie | `favicon.svg` i ikona app mają warianty jasny/ciemny; brak palety ciemnej dla UI aplikacji — decyzja: MVP tylko jasny? | decided · MVP tylko jasny; zapisane w karcie stylu (sekcja „Elementy UI — runda 1”) |
| G16 | **Stany formularzy auth** | FR-001 | błąd logowania, e-mail zajęty, reset hasła (link „Nie pamiętam hasła” prowadzi donikąd) | delivered częściowo · błąd logowania, `/reset`, „sprawdź skrzynkę”; **brak**: „e-mail zajęty”, walidacja hasła (→ runda 2) |

Reguła utrzymania: nowy brak wykryty podczas implementacji dostaje kolejny numer `G17…`, wpis w tej tabeli i (jeśli użyto placeholdera) komentarz `DESIGN-GAP: Gn` w kodzie. Autor po dostarczeniu zmienia status na `delivered` i wskazuje pliki.

### Do rundy 2 (zebrane 2026-09-18 po weryfikacji rundy 1)

1. **K8/K10** — nachodzący zakres jako błąd blokujący w `/imports/new/summary` (bez przycisku importu, zakres i link do istniejącego importu).
2. **G8** — stany błędów importu: nieznany format (z listą obsługiwanych banków), waluta ≠ PLN, pusty plik / brak obciążeń.
3. **G4** — akcja „Przywróć” dla wykluczonego wzorca (+ sekcja wykluczonych w `/patterns`, jeśli jej nie ma).
4. **G16** — „e-mail zajęty” w rejestracji, walidacja hasła.
5. **K5** — powitanie na dashboardzie bez imienia.
6. **K9** — `.badge.new` w prototypie na bursztyn zgodnie z `brand.css`.
7. **G14** — `tabs` (tylko jeśli implementacja ich potrzebuje).

## Jak kit wchodzi do aplikacji (dla `/10x-bootstrapper` i dalej)

- `react-kit/assets/` → `public/rytm/` (fonty, favicony, OG, ilustracje) lub import przez bundler dla SVG używanych jako komponenty; ikony z `icons/ui/ui.svg` przez `<use href="#id">` albo komponent ikon.
- `react-kit/styles/brand.css` → importowany **przed** stylami komponentów; tokeny `--rytm-*` są jedynym źródłem kolorów.
- `react-kit/docs/content.json` → moduł copy (i18n-ready, ale tylko `pl`).
- `prototype/styles.css` → wzorzec do przepisania na komponenty (nie kopiować 1:1; prototyp ma własne, rozjechane tokeny — K6).
- Trasy aplikacji po zalogowaniu zdefiniowane w `react-kit/docs/routes.md` (runda 1): `/home`, `/home-empty`, `/patterns`, `/patterns/:id`, `/fixed`, `/imports`, `/imports/new`, `/imports/new/account`, `/imports/new/summary`, `/imports/result`, `/settings`, `/reset`, `/components`. W aplikacji `/home-empty` i `/components` nie są osobnymi trasami — to stan `/home` i biblioteka deweloperska.
