# Bramka wizualna — `undo-import` (`/imports`: akcja usunięcia, dialog, linie statusu)

Źródło: `http://localhost:4399` (lokalny `astro dev` + lokalne Supabase), zrzuty z 2026-09-27 przez Playwright
(biblioteka z cache `npx`, headless systemowy Chrome, `channel: "chrome"`; skrypt poza repo, w scratchpadzie sesji).
Claude-in-Chrome nie był użyty (wymaga wyboru przeglądarki przez człowieka). Prototyp kitu serwowany lokalnie z
`design/rytm-os/` (`python3 -m http.server 4398`, tylko do zrzutów), modal otwarty przez `openModal('deleteImport')`.
Pasek narzędzi `astro dev` ukryty stylem wstrzykniętym w trakcie zrzutu.

Pliki to prawdziwe PNG z viewportu; stany strony `fullPage: true`, stany z dialogiem/fokusem — sam viewport. Repo
nie ma testu screenshotowego, więc nie są baseline'em. Wszystkie zrzuty aplikacji powstały **po** poprawkach tej
bramki (`8013681`: akcja wyrównana do lewej jak w kicie, fokus startowy na dialogu zamiast na przycisku „Usuń import”).

Konto: świeże lokalne `visual-undo-<timestamp>@rytm.local` (nigdy seedowe `test@rytm.local`) z dwoma importami
głównego wyciągu fixture'u `Lista_transakcji_nr_0000123456_010926.csv` (rachunek `Rachunek Firmowy Główny`)
podzielonego zakresem: 2025-09-01 – 2026-02-28 (93 obciążenia) i 2026-03-01 – 2026-08-31 (113 obciążeń) — payloady
zbudowane `parseIngStatement` + `buildImportPayload` z `src/lib/import/ing.ts` i wysłane `POST /api/imports`.
`success` i `empty-after-last-delete` to wynik prawdziwych usunięć przez dialog (klik „Usuń import” → submit →
przekierowanie `?deleted=1`).

## Stany (plan 2.9 / 2.10)

| Stan | desktop (1440×900) | mobile (400×812) | kit (prototyp) |
| --- | --- | --- | --- |
| `default` — 2 importy, piąta kolumna | `default-desktop.png` | `default-mobile.png`, `table-scrolled-mobile.png` (panel przewinięty do piątej kolumny) | `kit-default-desktop.png`, `kit-default-mobile.png` |
| `trigger-focus` — Tab na „Usuń import” | `trigger-focus-desktop.png` | `trigger-focus-mobile.png` | — (kit nie definiuje fokusu `.text-button`) |
| `dialog-open` — tytuł z prawdziwym zakresem | `dialog-open-desktop.png`, `dialog-focus-close-desktop.png` (fokus na „Zamknij”) | `dialog-open-mobile.png` | `kit-dialog-open-desktop.png`, `kit-dialog-open-mobile.png` |
| `success` — `?deleted=1`, jeden import | `success-desktop.png` | `success-mobile.png` | — (kit: toast, G30) |
| `error` — `?error=delete` | `error-desktop.png` | `error-mobile.png` | — (G30) |
| `not-found` — `?error=missing` | `not-found-desktop.png` | `not-found-mobile.png` | — (G30) |
| `empty-after-last-delete` — `?deleted=1`, zero importów | `empty-after-last-delete-desktop.png` | `empty-after-last-delete-mobile.png` | — (`imports-empty.html` bez statusu) |
| `pending` „Usuwanie…” | not captured — tylko przegląd kodu (natywny POST, za krótki) | — | — |

## Zmierzone w trakcie zrzutów

- `default`: 2 wiersze, `01.03–31.08.2026` / 113 i `01.09.2025–28.02.2026` / 93; brak poziomego przewijania strony
  (`scrollWidth` = szerokość viewportu na 1440 i 400).
- 400 px: tabela 549 px w panelu 363 px (`overflow-auto`), po przewinięciu (`scrollLeft` 186) przycisk kończy się na
  x = 365 < 400 — piąta kolumna osiągalna; strona nadal 400 px.
- Klawiatura (desktop i mobile): Tab dochodzi do pierwszego „Usuń import” (9 / 4 tabów), `:focus-visible` z
  pierścieniem 3 px `ink/15`; Enter otwiera dialog, fokus na samym dialogu (`[role=dialog]`); Tab → „Usuń import” →
  „Zamknij” → „Usuń import” (pułapka fokusu); Esc zamyka, fokus wraca na wyzwalacz z `:focus-visible`.
- Dialog: eyebrow „Cofnij import”, tytuł „Usunąć import 1 marca – 31 sierpnia 2026?”, `aria-describedby` ustawione.
  Szerokość: desktop 440 px (kit 480), 400 px → `left: 0`, 400 px (kit `left: 20`, 360 px) — tak samo jak pomiar
  G24 dla `/settings` (współdzielony `DialogContent`).
- Linie statusu: `Import usunięty.` (success, zielony `InlineAlert`), `Nie udało się usunąć importu. Spróbuj ponownie.`
  (error), `Nie znaleziono tego importu — mógł zostać już usunięty.` (not-found), zawsze pod `PageTitle`.
