# Bramka wizualna — `settings-account` Faza 2

Źródło: `http://localhost:4399` (lokalny `astro dev` + lokalne Supabase, konto `test@rytm.local`), zrzuty z 2026-09-22 przez Claude-in-Chrome.

## Stany desktop (klatka 1534×784)

| Plik                                          | Stan                                                                  |
| --------------------------------------------- | --------------------------------------------------------------------- |
| `settings-default-desktop.png`                | `/settings` — góra: eyebrow, `Twoje konto.`, panel „Dane logowania”   |
| `settings-default-lower-desktop.png`          | `/settings` — dół: wiersz „Przetwarzanie danych” + panel destrukcyjny |
| `settings-password-changed-desktop.png`       | `/settings?password=changed` — `InlineAlert success`                  |
| `settings-error-current-password-desktop.png` | `/settings?error=current-password` — `ServerError` w formularzu       |
| `settings-error-delete-desktop.png`           | `/settings?error=delete` — dialog otwarty z błędem, przycisk zablokowany |
| `settings-dialog-empty-desktop.png`           | Dialog otwarty, pusty input — przycisk nieaktywny                     |
| `settings-dialog-confirm-desktop.png`         | Dialog z wpisanym `USUŃ` — przycisk aktywny                           |
| `login-deleted-desktop.png`                   | `/login?deleted=1` — `InlineAlert success`                            |

Stan domyślny zajmuje dwie klatki, bo strona jest wyższa niż obszar zrzutu.

## Ograniczenia tej serii (do uzupełnienia ręcznie)

- **Format**: pipeline zrzutów zapisuje JPEG; pliki `.png` powstały przez `sips -s format png`, więc nie są bezstratne. Do oceny kompozycji wystarczają; nie nadają się na baseline testu screenshotowego (repo go nie ma — patrz „What We're NOT Doing” w planie).
- **Brak wariantu mobile 400 px**: okno przeglądarki nie dało się zwęzić przez to narzędzie (viewport pozostawał 1512×773 po `resize_window`). Zrzuty `*-mobile.png` oraz ręczny wiersz 2.9 wymagają przeglądarki człowieka (DevTools, tryb urządzenia, 400 px).
- Zweryfikowane przy okazji (wiersz 2.6, część): `usuń` nie odblokowuje przycisku, `USUŃ` odblokowuje, `Escape` zamyka dialog. Kolejność Tab i powrót fokusa na przycisk — do sprawdzenia ręcznie.
