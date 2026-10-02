# Mapowanie `copyExtra` do `content.json`

Nazwy namespace'ów poniżej odpowiadają obiektom tymczasowych treści aplikacji opisanym w briefie rundy 3. Nazwy istniejących kluczy zachowano tam, gdzie brief podawał ich nazwę; nowe stany używają osobnego namespace'u, żeby nie dublować treści.

| Namespace `copyExtra` | Namespace w `content.json` | Uwagi |
| --- | --- | --- |
| `auth` | `auth`, `authStates` | Panele wizualne auth są osobne od ekranów potwierdzenia e-maila i ustawienia hasła. |
| `home` | `home`, `dashboard` | Tekst pustego stanu i treści widoku z danymi są rozdzielone. |
| `imports` | `imports`, `importFlow`, `importErrors` | Wspólne słownictwo importu, kroki przepływu i typy błędów są odrębne. |
| `patterns` | `patterns`, `patternDetail`, `threshold`, `patternActions` | Lista, szczegół wzorca, próg i dialog działań mają własne klucze. |
| `fixed` | `fixedCosts` | Liczniki korzystają z polskich form liczebników. |
| `settings` | `settings` | Zawiera zmianę hasła, usunięcie konta, logout i konto demo. |
| `app` | `app`, `mobileNav` | Nawigacja boczna i dolna używają osobnych nazw. |
| `landing` | `landing` | Treść landing page pozostaje w swoim namespace. |
| `howItWorks` | `howItWorks` | Treść podstrony „Jak działa” pozostaje w swoim namespace. |
| `forWho` | `forWho` | Treść podstrony „Dla kogo” pozostaje w swoim namespace. |
| `emptyViews` | `emptyViews`, `emptyState` | Copy poszczególnych pustych widoków jest oddzielone od wspólnego CTA. |

Treść e-maila aktywacyjnego i ustawienia nowego hasła jest dostępna wyłącznie jako `confirmEmail.*` oraz `resetNew.*`. Nie należy dodawać ponownie `auth.confirmEmail*`, `auth.resetNew*` ani `auth.resetExpired`.
