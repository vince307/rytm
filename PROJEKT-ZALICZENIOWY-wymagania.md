# Projekt zaliczeniowy 10xDevs 4.0 — wymagania i terminy

Źródło: `.claude/skills/10x-idea-check/references/10xdevs-4-certification.md` oraz `10xdevs-4-dates.md` (paczka `m1l1`, pobrana 2026-09-15).
Cel pliku: wsad do sesji brainstormingowej „jaki projekt wybrać”. Skill `/10x-idea-check` czyta te same źródła i może posłużyć do wstępnej oceny pomysłu.

---

## Terminy

| Termin | Data | Uwagi |
|---|---|---|
| 1 | **4 listopada 2026** | jedyny z szansą na **wyróżnienie** i zaproszenie na **Demo Day** |
| 2 | 6 grudnia 2026 | |
| 3 | 10 stycznia 2027 | |

- Każdy termin: wskazany dzień do **23:59**.
- Po każdym terminie prowadzący mają **2 tygodnie** na sprawdzenie i feedback.
- Zasada feedbacku: **cisza = zaliczone**; certyfikat pojawia się po tym okresie. Jeśli coś wymaga poprawy, odzywają się z konkretnym komentarzem.
- Formularz zgłoszeniowy udostępnią **w ostatnim tygodniu programu**. Wysyłasz go **raz**, z takim zakresem, jaki zrealizowałeś (np. tylko Builder / Builder + Architect / wszystkie trzy). Zgłoszenia „Builder teraz, Architect za miesiąc” nie przejdą — liczy się pierwsze.
- Wszystkie 3 odznaki można zdobyć nawet w 3. terminie (bez wyróżnienia).
- Zaproszenia na Demo Day wysyłane są indywidualnie przez platformę — sprawdzać wiadomości po zakończeniu kursu.

---

## Trzy bloki certyfikacji

| Blok | Status | Zakres | Moduły |
|---|---|---|---|
| **10xBuilder** | obowiązkowy | full-stackowe MVP z wdrożeniem na chmurę | 1–3 |
| **10xArchitect** | dla ambitnych | rozbudowa architektury, modernizacja, refaktoryzacja, AI w dużej skali; na projekcie kursowym lub osobnym (szczegóły w pierwszych lekcjach modułu) | 3–4 |
| **10xChampion** | dla ambitnych | AI w pracy zespołowej, pipeline'y CI/CD; dalsza rozbudowa projektu kursowego | 5 |

---

## Wymagania obowiązkowe (10xBuilder)

Projekt **musi** zawierać:

1. **Mechanizm kontroli dostępu** odpowiedni dla typu aplikacji (np. ekran logowania)
2. **Zarządzanie danymi (CRUD)** — tworzenie, odczyt, aktualizacja, usuwanie, sensowne dla domeny
3. **Logika biznesowa** — z AI lub bez (OpenRouter to tylko jedna z opcji; AI **nie jest wymagane**)
4. **Dokumenty kontekstowe** — np. `prd.md`, `infrastructure.md`, `roadmap.md`
5. **Testy** — co najmniej **jeden test weryfikujący działanie z perspektywy użytkownika**

Opcjonalnie (mile widziane):
- Projekt dostępny pod **publicznym URL**, w App Store lub jako instalowalny pakiet (jeśli typ aplikacji na to nie pozwala — pominąć w opisie)

---

## Kryteria na wyróżnienie (tylko 1. termin — 4.11.2026)

- **Własna wersja 10xCards** — wszystkie wymagania obowiązkowe **+ publiczny URL**
- **Customowy projekt** — wszystkie wymagania obowiązkowe, **bez** wymogu publicznego URL (projekty wewnętrzne/korporacyjne są OK)

> Uwaga: w materiale źródłowym przy tym punkcie widnieje data „5.07.2026” — to pozostałość z edycji 3.0. Obowiązuje 4.11.2026 z pliku z datami.

---

## Wymogi techniczne

- **Stack dowolny** — nie musi być JS/web. Może być web, desktop, mobile, embedded.
- **Kluczowe: zastosowanie AI w procesie wytwarzania, nie złożoność aplikacji.**
- **Repo publiczne** nie jest wymagane. Prywatne OK — dodać jako collaboratora: `@przeprogramowani` / `@psmyrdek` / `@mkczarkowski`. Alternatywa: screenshoty struktury projektu (pliki kontekstowe, testy, CI/CD).
- **Projekty niewebowe/niestandardowe** — kryteria dostosowywane do sytuacji; nie wymagają publicznego URL ani płatnej certyfikacji App Store. Liczy się zachowany przepływ: dokumentacja, testy, automatyzacja. W razie wątpliwości: wątek w Dyskusje / Praktyka + oznaczyć prowadzących.
- **Rozbudowa istniejącego projektu** — dozwolona, jeśli widać powiązanie materiału kursowego (skille, dokumentacja, testy, CI/CD) z tym, co zrobiłeś. Skille do planowania i implementacji są uniwersalne.

## Ocena zgłoszeń

- Weryfikacja: **człowiek wspomagany AI**, nie automat.
- Oceniany jest rzeczywisty wysiłek i zrozumienie materiału, nie tylko checklista.
- **Nie** oceniają złożoności aplikacji.
- **Nie** weryfikują stopnia wykorzystania AI — projekt robisz dla siebie.

---

## Jak wybrać projekt — rady prowadzących

**Najważniejsze słowo: MVP** — najmniejsza wersja produktu dająca konkretną wartość.

**Czujnik dymu:** jeśli pierwszy działający przepływ wymaga **więcej niż tygodnia pracy po godzinach — zmniejsz MVP**. (W lekcjach M1 mowa o 3 tygodniach; tu kryterium jest ostrzejsze.) Potrzebujesz czasu na dokumentację, testy, CI/CD i poprawki po feedbacku.

**Najlepiej przyjmowane projekty na Demo Days** były czymś realnym dla twórcy: narzędzie dla znajomych, rozwiązanie problemu w rodzinie, usprawnienie własnej pracy. Nie chodzi o podbijanie świata — o zajawkę i kontekst.

**Czego unikać:**
- **Za duże MVP** — „aplikacja do finansów” → import z banku, skanowanie paragonów, wykresy, budżety, alerty, coach AI. Każda funkcja osobno OK, razem = startup, nie projekt kursowy.
- **Pusty CRUD** — lista zadań / lista książek to fundament, ale sama lista nie wystarczy. Dodaj regułę: rekomendację, priorytetyzację, walidację, scoring. (Lekcja M1L1: „prosty pomysł jest w porządku; chodzi o to, żeby coś w nim faktycznie decydowało, a niekoniecznie o to, żeby dodać do niego AI”.)
- **Wysoki próg zero-to-one** — tydzień pracy, a nadal nie da się wykonać jednej sensownej akcji.

**Masz dwa pomysły?** Wybierz ten z krótszą drogą do pierwszego przepływu i bardziej oczywistą logiką biznesową. Efektowność pojawia się później.

> W źródle jest odwołanie „Użyj tej tabeli do pierwszej oceny swojego pomysłu” — tabela nie została wyeksportowana (prawdopodobnie obrazek na platformie).

**Warto wiedzieć:**
- Przygotowania techniczne = moduł 1; właściwa praca nad projektem startuje od **modułu 2** (workflow implementacji funkcjonalności).
- Trzy terminy — nie stresować się tempem.
- Jakość artefaktów (PRD, specyfikacje) = klucz do sukcesu z AI.
- Niestandardowy pomysł → wątek w Dyskusje / Praktyka, oznaczyć prowadzących lub mentorów.

**Rekomendacje narzędzi:**
- Ekosystem VS Code → Cursor, potem Windsurf lub alternatywy
- Ekosystem JetBrains → Claude Code w terminalu lub Windsurf/Cline jako plugin
- Niezależnie od IDE → Claude Code lub Codex CLI jako domyślne narzędzie

---

## Powiązania z lekcjami M1 (na potrzeby brainstormingu)

- `/10x-idea-check` (M1L1) — wstępna ocena pomysłu; bierze pod uwagę doświadczenie programistyczne, doświadczenie w kończeniu projektów z agentami, czas tygodniowo i wybrany termin. Trzy możliwe rekomendacje: przejdź do shape / zmień zakres / najpierw wyjaśnij przeszkodę.
- `/10x-shape` closing soft-gate (M1L1) — pytania kontrolne: access control, business logic, artefakty, koszt czasu (3 tyg. po godzinach lub świadomie dłużej), non-goals, (brownfield) zachowanie istniejących funkcji.
- Odznaka Builder wymaga logiki biznesowej — `/10x-shape` ostrzeże o pustym CRUD-zie, ale nie zablokuje sesji.
- Przykładowy projekt kursowy: **10xCards** (fiszki z AI: generacja z tekstu, bramka akceptacji, algorytm powtórek, konta użytkowników). Własna wersja 10xCards z publicznym URL kwalifikuje się do wyróżnienia.

## Otwarte pytania do brainstormingu

- Termin: celować w 1. (4.11.2026, wyróżnienie) czy dać sobie zapas do 2./3.?
- Ile godzin tygodniowo realnie?
- Greenfield vs rozbudowa istniejącego projektu?
- Które bloki: tylko Builder, czy też Architect / Champion?
- Jaka reguła biznesowa („co w tym decyduje”) — żeby uniknąć pustego CRUD-a?
- Web (publiczny URL → wyróżnienie łatwiejsze) czy inny typ aplikacji?
