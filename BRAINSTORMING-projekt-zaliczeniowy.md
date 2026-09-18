# Brainstorming projektu zaliczeniowego 10xDevs 4.0 — zapis sesji i decyzje

Data: 2026-09-15
Nazwa projektu: **Rytm** (2026-09-16). Katalog: `/Users/kamilp/Dev/10xDevs40/Rytm`.
Status: **decyzja podjęta**, `/10x-idea-check` wykonany (rekomendacja: przejdź do sesji planistycznej).
Następny krok: `/10x-init` → `/10x-shape` → `/10x-prd` (prompt na końcu pliku).

Powiązane pliki: `PROJEKT-ZALICZENIOWY-wymagania.md` (wymagania, terminy, antywzorce), `PROMPT-brainstorming-projekt.md` (prompt, którym uruchomiono tę sesję).

---

## 1. Ramy (odpowiedzi z wywiadu)

| Rama | Wartość |
|---|---|
| Termin | **1 — 4 listopada 2026, 23:59** (strefa nieokreślona w źródle, przyjmujemy Europe/Warsaw). Zależy mi na wyróżnieniu. |
| Czas | 10–15 h/tydz. Pojemność do terminu ok. 70–100 h, realnie na projekt 50–75 h (moduł 1 to przygotowania, ostatni tydzień na test/dokumenty/formularz). To pojemność, nie estymata. |
| Bloki | **Tylko Builder**. Formularz wysyłany raz, zakres pierwszego zgłoszenia jest wiążący. |
| Doświadczenie programistyczne | 10 lat full stack: Node, React, Heroku, Vercel, bazy danych. |
| Doświadczenie z agentami | Kilka wdrożonych projektów (profil „has shipped substantial agent-assisted work”). |
| Typ | **Greenfield**, aplikacja webowa z publicznym URL (opcjonalny dla customowego projektu, ale tani przy znajomości Vercela). |

## 2. Problem (skąd wyszedł pomysł)

- Obszar: kontrola wydatków, „gdzie pieniądze są palone”.
- Stan dziś: eksport CSV/PDF z dwóch banków (**ING Bank Śląski**, **Erste**). Bank kategoryzuje, ale nie ufam temu i brakuje mi konkretnej odpowiedzi. Patrzę na saldo pod koniec miesiąca i czuję, że coś ucieka. Analiza w arkuszu to męka.
- Pytania, na które bank nie odpowiada (wybrane dwa): **„które wydatki były zbędne?”** oraz **„co się powtarza i cicho rośnie?”**.
- Jak rozpoznaję „zbędne”: **po częstotliwości** (n-te wystąpienie w okresie ponad to, co uznaję za rozsądne).
- Co znaczy „ten sam wydatek”: **ten sam sprzedawca i podobna kwota**.
- Banki/waluty: oba banki, **twarda reguła: tylko PLN**, bez przeliczania kursów.

Uwaga z wymagań: „aplikacja do finansów” to kanoniczny przykład za dużego MVP. Zakres poniżej został celowo obcięty.

## 3. Reguła biznesowa (robocza)

- Normalizacja opisu transakcji → sprzedawca.
- Dwa typy wzorców (decyzja po devil's advocate):
  - **stały**: sprzedawca + kwota w tolerancji (subskrypcje, opłaty, raty); próg = zmiana kwoty / nowy wzorzec;
  - **częsty**: sam sprzedawca niezależnie od kwoty (Wolt, kawa itp.); próg = liczba wystąpień lub suma w miesiącu.
- Nadwyżka ponad próg → etykieta **„zbędne”**, sumowana w widoku **„spalone w tym miesiącu”**.
- Wzorce stałe: pokazuj, które podrożały i które są nowe.

## 4. Kandydaci (trzy cięcia tego samego problemu)

| | A — „Powtórki” (wzorce + próg) | B — „Subskrypcje” (tylko stałe koszty) | C — „Budżet z importem” (A + kategorie + limity) |
|---|---|---|---|
| Pierwszy przepływ | upload CSV → lista wzorców; 4–6 wieczorów, mieści się w tygodniu | 3–4 wieczory | 2–3 tygodnie |
| Reguła biznesowa | grupowanie + próg; coś decyduje | okresowość + zmiana ceny; wąska, nie odpowiada na „zbędne po częstotliwości” | dwie–trzy reguły; za dużo na termin 1 |
| Builder | login naturalny (dane prywatne), CRUD na wzorcach/progach/importach, test „wgrywam CSV, ustawiam próg, widzę nadwyżkę”, Vercel + Postgres | wchodzi, ale CRUD cienki | wchodzi kosztem czasu na testy i artefakty |
| Ryzyka | formaty CSV obu banków, prawdziwe dane pod publicznym URL, dostrojenie tolerancji kwoty | za chude, nie rozwiązuje problemu z Woltem | dokładnie antywzorzec „aplikacja do finansów” |
| Architect (nieużywane) | kategoryzacja, silnik reguł, historia wieloletnia, alerty | rozszerza się do A | najwięcej |

**Wybór: A.** B za cienkie, C za grube.

### 4a. Punkty odniesienia spoza problemu (dopisane 2026-09-15)

Wyszukiwanie w sieci dało mało: nagrania Demo Day są na YouTube bez listy projektów, a polskie listy „pomysłów do portfolio” to blog/sklep/forum/todo, czyli pusty CRUD z antywzorców. Wspólna rada ze źródeł: „zbuduj to, co i tak zrobiłbyś dla siebie”. Poniższe trzy wyprowadzone z ram (osobiste narzędzie, jedna reguła, pierwszy przepływ w tydzień), nie skopiowane z list.

| | 1. Karencja zakupowa | 2. Co ugotować z tego, co mam | 3. Kolejka przeglądu kodu |
|---|---|---|---|
| Opis | wpisujesz planowany zakup; reguła: kup / poczekaj do daty / odpuść wg limitu impulsowego, karencji zależnej od kwoty i podobnych zakupów z 90 dni | CRUD przepisów i lodówki; ranking przepisów po % składników na stanie, dacie ostatniego gotowania i czasie | pobiera otwarte PR-y z GitHuba; scoring po wieku, wielkości diffu, oczekujących recenzentach, blokowaniu release |
| Pierwszy przepływ | 2–3 wieczory, zero parsowania | 3–4 wieczory | 4–5 wieczorów, głównie integracja API |
| Reguła | jasna, 3 wejścia, 1 decyzja | scoring z 3 wagami | wyraźna, przydatna w pracy |
| Builder | login, CRUD zakupów/limitów, test „zakup 1500 zł → data karencji” | wszystko naturalnie, test „jajka+ser → omlet na górze” | GitHub OAuth, CRUD reguł/wyjątków, test na mocku API |
| Ryzyka | wygląda na prosty; wymaga dyscypliny wpisywania, której nie mam | koszt wprowadzania danych; brak zajawki → projekt „dla oceniających” | zgoda na repo firmowe, token, rate limity; na demo potrzebne publiczne repo z ruchem |
| Relacja do A | **plan B w tej samej domenie**, jeśli bramka CSV wypadnie źle; prewencja vs analiza | kalibracja: projekt bez własnego problemu w środku | kalibracja: koszt zewnętrznej zależności; A ma jedną (CSV na dysku) |

Werdykt: A zostaje. Punkt 1 = plan B. Punkty 2 i 3 tylko do kalibracji.

Źródła: [Demo Day 10xDevs, 9 projektów](https://www.youtube.com/watch?v=cKU4jlaUnZc), [Demo Day 2. edycja](https://www.youtube.com/watch?v=b-gOI128G2s), [10x-cards z edycji 3](https://github.com/dawid-focht/10x-cards), [certification project](https://github.com/krzysztof-adamowski/10x-devs-certification-project), [30 pomysłów na tydzień (Revenue Map)](https://revenuemap.app/ideas/build-in-1-week), [10 pomysłów do portfolio (Modest Programmer)](https://modestprogrammer.pl/programowanie-10-pomyslow-na-aplikacje-do-portfolio-przed-rozmowa-kwalifikacyjna), [25 side project ideas 2026 (coderfile.io)](https://coderfile.io/blog/side-project-ideas-developers-2026).

## 5. Kontrola anty-bias dla A

### Devil's advocate
1. Grupowanie „sprzedawca + podobna kwota” kłóci się z regułą częstotliwości (Wolt 38/67/112 zł rozpada się na trzy wzorce). → Rozwiązanie: dwa typy wzorców od razu w PRD.
2. Pośrednicy zjadają sprzedawcę (PayPal, Allegro, BLIK, Google Pay). „Allegro 8 razy” nie jest odpowiedzią. → Oznaczyć jako „nieprzezroczyste” i wyłączyć z reguły (sugestia opcjonalna).
3. Erste to niewiadoma: który Erste, czy daje CSV czy tylko PDF, czy konto jest w PLN. Jeśli nie — zostaje jeden bank. → Bramka dnia pierwszego.
4. Prawdziwe wyciągi pod publicznym URL i w repo. → Syntetyczny zestaw CSV od pierwszego tygodnia; własne dane zostają lokalnie.
5. Wartość pojawia się dopiero z historią: po jednym imporcie są wzorce i puste progi; jeśli eksport tylko z 90 dni, trend ma dwa punkty. → Sprawdzić zakres eksportu; import wielu plików (sugestia opcjonalna).

### Pre-mortem („4 listopada, żałuję”)
Pierwszy tydzień na parsery (ING cp1250 i nagłówki w kilku liniach, Erste okazało się PDF-em). Normalizacja na własnych danych: połowa wzorców to ALLEGRO/PAYPAL/BLIK, Wolt rozbity na siedem grup po kwotach. Dwa wieczory na dostrajanie tolerancji zamiast zamrożenia. Dwa typy wzorców dodane w trzecim tygodniu → przepisany model danych i testy. Brak syntetycznych danych → test na zanonimizowanym fragmencie własnego wyciągu. PRD nieaktualizowany od shape. Na demo: lista sprzedawców z licznikiem i polem „próg”, oceniający nie widzą, co decyduje. Prawdziwy błąd: uznanie heurystyk na brudnych danych za detal, a to był cały projekt.

### Poprawki przyjęte po kontroli (nie powiększają zakresu)
- Dwa typy wzorców (stały / częsty) od razu w PRD, z osobnymi progami.
- Syntetyczny zestaw CSV jako artefakt **pierwszego** tygodnia: testy, demo, seed publicznego URL.
- Bramka dnia pierwszego: pobrać eksport z obu banków, sprawdzić format i walutę. Jeśli Erste nie daje CSV w PLN → start z samym ING, Erste w non-goals.

## 6. Non-goals pierwszej wersji
- integracja z API banków / otwarta bankowość
- kategoryzacja wydatków i limity na kategorię
- wiele walut i przeliczanie kursów
- rozbijanie transakcji z pośredników (PayPal, Allegro, BLIK) na składowe
- OCR paragonów, wykresy inne niż lista i suma, alerty, coach AI
- wielu użytkowników w jednym gospodarstwie domowym

## 7. Wynik `/10x-idea-check` (2026-09-15)

**Przejdź do sesji planistycznej.** Pomysł ma użyteczny rezultat, jedną wyraźną regułę i dostępną zależność (CSV z ING). Ryzyko leży w heurystykach na brudnych danych, co rozwiązuje dopracowanie, nie wstępne sprawdzenie.

- Pierwszy kamień milowy: CSV z ING → lista wzorców z liczbą wystąpień i sumą (odsłania największą niewiadomą: jakość grupowania na prawdziwych danych).
- MVP: dwa typy wzorców, progi, „spalone w tym miesiącu”, zmiany cen wzorców stałych, logowanie, zarządzanie wzorcami i importami.
- Dopasowanie do Buildera: login (dane prywatne), CRUD na wzorcach/importach, reguła progu bez AI, test z perspektywy użytkownika, publiczny URL opcjonalny. Decyzja certyfikacyjna należy do recenzentów.
- Równolegle, nie blokująco: sprawdzić eksport Erste (CSV? PLN?).

## 8. Otwarte pytania do `/10x-shape`
- Obsługa Erste — zależna od formatu eksportu i waluty.
- Dokładna tolerancja kwoty dla wzorców stałych (procent? kwota? oba?).
- Zakres historii potrzebny, by trend miesięczny miał sens; ile miesięcy daje eksport ING.
- Co zrobić z transakcjami pośredników (PayPal/Allegro/BLIK): ignorować, oznaczyć, liczyć jak zwykłe?
- Sugestie opcjonalne (NIE są zaakceptowanym zakresem): flaga „nieprzezroczyste” dla pośredników; import wielu plików naraz.

---

## 9. Prompt na następną sesję (skopiuj w całości)

```
Kontynuujemy projekt zaliczeniowy 10xDevs 4.0. Brainstorming jest zamknięty, decyzja podjęta, /10x-idea-check wykonany.
Nazwa projektu: Rytm (wybrana 2026-09-16). Pracujemy w katalogu /Users/kamilp/Dev/10xDevs40/Rytm — sesję otwórz w nim; skille 10x są skopiowane do jego .claude/.

Przeczytaj najpierw:
- @BRAINSTORMING-projekt-zaliczeniowy.md — pełny zapis sesji, ramy, reguła biznesowa, non-goals, poprawki po devil's advocate/pre-mortem, otwarte pytania
- @PROJEKT-ZALICZENIOWY-wymagania.md — wymagania Buildera i terminy

Ramy w skrócie: termin 1 (4.11.2026, wyróżnienie), 10–15 h/tydz., tylko Builder, greenfield, web, 10 lat full stack JS, kilka wdrożonych projektów z agentami.
Plan B (tylko jeśli bramka CSV wypadła źle): „Karencja zakupowa” z sekcji 4a pliku brainstormingu.

Zadanie na tę sesję:
1. Uruchom /10x-init (scaffold context/).
2. Uruchom /10x-shape z poniższym opisem pomysłu. W trakcie sesji trzymaj się non-goals z pliku i dwóch typów wzorców; jeśli zaproponujesz kategorie, budżety lub AI w produkcie — zatrzymaj się i przypomnij, że to jest w non-goals.
3. Po shape zatrzymaj się. /10x-prd uruchomię sam po przeczytaniu shape-notes.md.

Opis pomysłu do /10x-shape:
Aplikacja webowa dla jednej osoby, która wgrywa CSV z wyciągu bankowego (ING Bank Śląski, tylko PLN) i chce zobaczyć, gdzie cicho ucieka pieniądz. Aplikacja normalizuje opisy transakcji do sprzedawcy i wykrywa dwa typy wzorców: stałe (sprzedawca + podobna kwota) i częste (sam sprzedawca). Użytkownik ustawia próg na wzorcu, a reguła oznacza nadwyżkę jako zbędną i sumuje ją miesięcznie; dla wzorców stałych pokazuje zmiany kwoty i nowe wzorce. Zaakceptowane zmiany po kontroli: dwa typy wzorców od razu, syntetyczny zestaw CSV jako artefakt pierwszego tygodnia, prawdziwe wyciągi zostają lokalnie. Poza zakresem: API banków, kategorie i budżety, wiele walut, rozbijanie transakcji z pośredników (PayPal, Allegro, BLIK), OCR, alerty, AI. Nierozstrzygnięte: obsługa Erste (zależna od formatu eksportu), dokładna tolerancja kwoty dla wzorców stałych, zakres historii potrzebny, by trend miesięczny miał sens.
```

Przed tą sesją (bramka dnia pierwszego, poza agentem): pobierz eksport CSV z ING i z Erste, sprawdź kodowanie, separator, nagłówki, walutę i zakres dat. Wynik wpisz do sekcji 8 tego pliku albo powiedz agentowi na starcie shape.
