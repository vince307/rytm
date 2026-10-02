import content from "../../design/rytm-os/react-kit/docs/content.json";

/** Kit copy — `design/rytm-os/react-kit/docs/content.json`, read-only. */
export const copy = content;

/**
 * Strings the prototype renders but content.json does not contain (design-kit.md K11).
 * Taken verbatim from design/rytm-os/prototype/app.js. Remove entries as the author adds keys.
 */
export const copyExtra = {
  auth: {
    loginVisual: {
      eyebrow: "Twój rytm",
      title: "Wróć do swojego rytmu.",
      lead: "Twoje wzorce wydatków czekają na kolejny miesiąc.",
    },
    registerVisual: {
      eyebrow: "Twój rytm",
      title: "Zacznij widzieć więcej.",
      lead: "Jedno konto, jeden spokojny widok Twoich wydatków.",
    },
    resetVisual: {
      eyebrow: "Spokojnie",
      title: "Hasło można ustawić na nowo.",
      lead: "Wyślemy Ci prostą instrukcję na adres przypisany do konta.",
    },
    optional: "opcjonalne",
    namePlaceholder: "np. Ola",
    emailPlaceholder: "ty@przyklad.pl",
    passwordPlaceholder: "••••••••",
    forgotPassword: "Nie pamiętam hasła",
    terms: "Zakładając konto akceptujesz regulamin.",
    noAccount: "Nie masz jeszcze konta?",
    createIt: "Utwórz je",
    haveAccount: "Masz już konto?",
    resetEyebrow: "Nie pamiętam hasła",
    sendInstructions: "Wyślij instrukcję",
    backToLogin: "Wróć do logowania",
    checkInboxEyebrow: "Sprawdź skrzynkę",
    checkInboxTitle: "Link jest w drodze.",
    // Round 2 prototype strings that content.json still lacks (design-kit.md K11, round 3):
    confirmedLogin: "E-mail potwierdzony — zaloguj się.",
    occupiedOr: "lub",
    newPassword: "Nowe hasło",
    repeatPassword: "Powtórz hasło",
    saveNewPassword: "Zapisz nowe hasło",
    doneEyebrow: "Gotowe",
    resetSuccessLead: "Możesz teraz zalogować się do swojego rytmu.",
    // DESIGN-GAP: K11 — states the kit names but gives no copy for.
    passwordsDiffer: "Hasła muszą być takie same.",
    resetNewError: "Nie udało się zmienić hasła. Spróbuj ponownie.",
    saving: "Zapisywanie…",
    resent: "Wysłaliśmy link ponownie.",
    resendError: "Nie udało się wysłać ponownie. Spróbuj za chwilę.",
    // DESIGN-GAP: G24 — `/login?deleted=1` note the kit does not define.
    deletedLogin: "Konto zostało usunięte.",
  },
  home: {
    emptyEyebrow: "Przegląd miesiąca",
    emptyTitle: "Zacznij od pierwszego importu.",
    emptyLead: "Rytm pokaże Ci wzorce, kiedy dostanie pierwszy wyciąg.",
    emptyIllustrationAlt: "Dokument czekający na import",
    // DESIGN-GAP: K24 — verbatim from `prototype/app.js` `applyDashboardState` (`#/home-no-name`); the kit bakes
    // the month into the sentence ("Twój maj w jednym spokojnym widoku."), `{month}` + `monthsNominative`
    // generalise it (May reproduces the kit string byte for byte, `patterns.monthsLocative` precedent).
    lead: "Twój {month} w jednym spokojnym widoku.",
    monthsNominative: [
      "styczeń",
      "luty",
      "marzec",
      "kwiecień",
      "maj",
      "czerwiec",
      "lipiec",
      "sierpień",
      "wrzesień",
      "październik",
      "listopad",
      "grudzień",
    ],
    // DESIGN-GAP: G35 — the kit's trend panel has no state for "no pattern has an applicable threshold at all";
    // placeholder, the author supplies the final copy.
    noThreshold: "Ustaw próg na wzorcu, a tu pojawi się suma ponad progiem.",
    // DESIGN-GAP: K25 — the kit prints these only as `content.json` `dashboard.stats[].foot` *samples*
    // ("+42,20 zł względem kwietnia", "2 pozycje podrożały"); the templates below reproduce them byte for byte.
    deltaFoot: "{delta} względem {month}",
    monthsGenitive: [
      "stycznia",
      "lutego",
      "marca",
      "kwietnia",
      "maja",
      "czerwca",
      "lipca",
      "sierpnia",
      "września",
      "października",
      "listopada",
      "grudnia",
    ],
    risen: "{n} {items}",
    risenForms: ["pozycja podrożała", "pozycje podrożały", "pozycji podrożało"],
  },
  imports: {
    eyebrow: "Importy CSV",
    title: "Twoje źródła danych.",
    lead: "Każdy import możesz cofnąć. Plik CSV nie jest przechowywany po imporcie.",
    newEyebrow: "Nowy import",
    newLead: "Wybierzesz jeden rachunek z pliku. Import obejmuje tylko obciążenia.",
    back: "Wróć do importów",
    dropTitle: "Upuść plik CSV tutaj",
    choose: "Wybierz plik",
    newImport: "+ Nowy import",
    // Imports table (prototype imports(), app.js:56) — column headers and the account cell.
    table: { importedOn: "Data importu", account: "Rachunek", range: "Zakres dat", debits: "Obciążenia" },
    // DESIGN-GAP: K26 — the kit has only the single ING account label; the app adds a per-bank template
    // (S-10 Phase 5), filled through `accountLabel()` so an unknown source never crashes the row.
    accountLabel: { ing: "ING · {name}", santander: "Santander · {name}" },
    // DESIGN-GAP: K26 — the Santander export has no account name column (the owner's name, header col 3, is
    // never stored, R2); "Rachunek" is the kit's own word for the column, used as a neutral stand-in.
    santanderAccountName: "Rachunek",
    // Result screen (prototype importResult(), app.js:63).
    resultEyebrow: "Import gotowy",
    toPatterns: "Zobacz wzorce",
    toOverview: "Przejdź do przeglądu",
    transactionForms: ["transakcja", "transakcje", "transakcji"],
    // DESIGN-GAP: G26 — result screen before patterns exist (S-03): the kit h1 `importFlow.result`
    // („Wzorce są już widoczne.”) and the pattern stats do not apply yet; placeholder h1 from the
    // prototype lead („Dodaliśmy 64 obciążenia…”).
    resultTitle: "Dodaliśmy {n} {debits}.",
    debitForms: ["obciążenie", "obciążenia", "obciążeń"],
    // Import wizard (prototype importsNew/uploadReady/importAccount/importSummary, app.js:57–61).
    formatRecognised: "rozpoznano format ING",
    next: "Dalej",
    stepBack: "Wstecz",
    stepEyebrow: "Nowy import · krok {n} z 3",
    accountTitle: "Wybierz rachunek.",
    // The prototype spells the count as a word („trzy rachunki”); the app interpolates the number.
    accountLead: "Ten plik zawiera {n} {accounts}. Domyślnie zaznaczyliśmy ten z największą liczbą transakcji.",
    accountForms: ["rachunek", "rachunki", "rachunków"],
    selected: "wybrane",
    bankName: "ING Bank Śląski",
    summaryTitle: "Sprawdź przed importem.",
    summary: {
      account: "Rachunek",
      range: "Zakres dat",
      debits: "Obciążenia do importu",
      skipped: "Pominięte wpływy / zwroty",
    },
    overlapTail: "Wybierz inny plik albo wróć do importów.",
    // DESIGN-GAP: K16 — `importErrors.overlap` has the date baked in („…import: 1 marca – 31 maja 2026.”);
    // the app interpolates the real range after this prefix (prototype importSummary, app.js:61).
    overlapPrefix: "Ten zakres nachodzi na istniejący import:",
    // DESIGN-GAP: G25 — step 3 has no "range is free → confirm" state in the kit; placeholder button from the
    // pre-K8 prototype („Importuj 64 obciążenia”), plural forms in `debitForms`.
    confirm: "Importuj {n} {debits}",
    importing: "Importowanie…",
    // Delete action + dialog (S-02, prototype imports() / modal('deleteImport'), app.js) — verbatim from app.js.
    // DESIGN-GAP: K19 — content.json has no key for the delete action, the dialog copy or its close label; the
    // kit h2 hardcodes the month („Usunąć import z maja?”), so the app interpolates the real range instead.
    deleteAction: "Usuń import",
    deleteDialogEyebrow: "Cofnij import",
    deleteDialogTitle: "Usunąć import {range}?",
    deleteDialogBody:
      "Wzorce wykryte w tym imporcie zostaną przeliczone. Tę decyzję można cofnąć przez ponowny import.",
    close: "Zamknij",
    // DESIGN-GAP: K20 — the kit toast „Import usunięty w prototypie.” names the prototype; the shippable line
    // drops „w prototypie” and, since the flow is a server redirect, is shown by InlineAlert, not a toast.
    deleted: "Import usunięty.",
    // DESIGN-GAP: G30 — result states of import deletion the kit does not define (toast has no repo counterpart
    // and the flow is a server redirect → InlineAlert above the list): pending, failure and not-found copy.
    deleting: "Usuwanie…",
    deleteError: "Nie udało się usunąć importu. Spróbuj ponownie.",
    deleteMissing: "Nie znaleziono tego importu — mógł zostać już usunięty.",
    // DESIGN-GAP: G37 — the kit has no state for an action refused on the shared demo account (S-09, FR-014):
    // shown for `/imports?error=demo` and the wizard's `?error=demo`.
    demoLocked: "To jest wspólne konto demo — dodawanie i cofanie importów jest wyłączone.",
  },
  patterns: {
    eyebrow: "Wzorce wydatków",
    // DESIGN-GAP: K11 — strings of prototype patterns() / patternRows() / badge() absent from content.json.
    upload: "+ Wgraj CSV",
    typeLabels: { fixed: "stały", frequent: "częsty" },
    sortPrefix: "Sortuj: ",
    footer: "{n} {patterns} · wszystkie miesiące",
    patternForms: ["wzorzec", "wzorce", "wzorców"],
    // DESIGN-GAP: K17 — the kit table has no "kwota dla stałych" column (FR-007); placeholder header.
    amountColumn: "Kwota",
    // DESIGN-GAP: K21 — detail / threshold-editor / list strings the prototype renders that content.json still
    // lacks (round 3); taken verbatim from app.js patternDetail() / thresholdEditor() / patternRows() / showToast().
    detailEyebrow: " wzorzec",
    typeLeads: {
      fixed: "Sprzedawca o stałej, powtarzalnej kwocie.",
      frequent: "Sprzedawca, który wraca niezależnie od kwoty.",
    },
    thresholdPanel: "Próg wzorca",
    thresholdActive: "aktywny",
    thresholdNone: "brak ustawionego progu",
    // thresholdEditor()'s save button when no threshold is set yet; content.json's threshold.save ("Zapisz
    // próg") covers only the change path.
    setThreshold: "Ustaw próg",
    // thresholdEditor()'s onclick toast for removal (showToast('Próg usunięty.','info')).
    thresholdRemoved: "Próg usunięty.",
    // thresholdEditor()'s field label and input-suffix text; content.json's threshold object holds only the
    // button/note copy, not these.
    valueLabel: { amount: "Kwota", count: "Liczba wystąpień" },
    suffix: { money: "zł", count: "×" },
    occurrencesPanel: "Wystąpienia w miesiącu",
    sequenceWithin: "W ramach progu",
    overBadge: "ponad próg",
    // patternRows()'s Próg-cell format for a `count` threshold and the arrow cell's aria-label; verbatim.
    thresholdCount: "{n} × / miesiąc",
    openPattern: "Otwórz wzorzec",
    occurrenceForms: ["wystąpienie", "wystąpienia", "wystąpień"],
    // `patternDetail.sumLabel` bakes the month in ("Suma w maju"); `{month}` + `monthsLocative` generalise it —
    // May reproduces the kit string byte for byte.
    sumLabel: "Suma w {month}",
    monthsLocative: [
      "styczniu",
      "lutym",
      "marcu",
      "kwietniu",
      "maju",
      "czerwcu",
      "lipcu",
      "sierpniu",
      "wrześniu",
      "październiku",
      "listopadzie",
      "grudniu",
    ],
    // DESIGN-GAP: G31 — states/pieces of the pattern detail and threshold editor the kit does not define.
    detailMissing: "Nie znaleziono tego wzorca — mógł zniknąć po usunięciu importu.",
    monthEmpty: "Brak wystąpień w tym miesiącu.",
    overInMonth: "Ponad progiem w {month}",
    sequenceSummary: "{n} {occurrences}, {over} ponad próg",
    thresholdInvalid:
      "Podaj wartość większą od zera — liczbę całkowitą lub kwotę z najwyżej dwoma miejscami po przecinku.",
    thresholdSaveError: "Nie udało się zapisać progu. Spróbuj ponownie.",
    // Próg-cell format for a `sum` threshold — the kit's patternRows() never renders one (its five sample
    // patterns hold only count/amount thresholds), so this is a placeholder generalising the `count` format.
    thresholdSum: "{amount} / miesiąc",
    // DESIGN-GAP: K22 — the "Akcje" dialog and its result toasts exist only in prototype/app.js
    // (modal('patternActions'), showToast() calls in modal()), not in content.json; taken verbatim.
    actions: "Akcje",
    actionsEyebrow: "Akcje na wzorcu",
    actionsTitle: "Zarządzaj wzorcem.",
    actionsLead: "Decyzje dotyczą wszystkich kolejnych miesięcy. Możesz je później odwrócić w ustawieniach wzorca.",
    typeChanged: "Typ wzorca zmieniony.",
    excludedToast: "Wzorzec wykluczony z analizy.",
    // modal()'s close button aria-label is shared across every modal type, including patternActions.
    close: "Zamknij",
    // `/patterns`'s "Wykluczone" toggle (prototype patterns(), excluded-toggle button text) — verbatim, S-05 faza 7.
    excludedToggle: "Wykluczone",
    // DESIGN-GAP: G33 — the kit names no merge picker, rename field, direct-submit type/exclude, merged-variants
    // list, merge undo or result-line copy for FR-009 (the prototype only fires toasts on closeModal()); every
    // string below is a placeholder built from tokens and kit-adjacent phrasing, not a design decision.
    mergeLabel: "Scal z wzorcem",
    mergeSubmit: "Scal",
    mergeNone: "Brak innych wzorców do scalenia.",
    renameLabel: "Nazwa sprzedawcy",
    renameHint: "Pusta nazwa przywraca nazwę z wyciągu.",
    renameSubmit: "Zapisz nazwę",
    merged: "Wzorce scalone.",
    unmerged: "Scalenie cofnięte.",
    renamed: "Nazwa zmieniona.",
    mergedLabel: "Scalone warianty",
    unmerge: "Cofnij scalenie",
    mergeInvalid: "Nie można scalić z tym wzorcem.",
    nameInvalid: "Nazwa może mieć najwyżej 100 znaków.",
    decisionError: "Nie udało się zapisać decyzji. Spróbuj ponownie.",
  },
  fixed: {
    eyebrow: "Koszty stałe",
    lead: "Rytm porównuje miesiące kalendarzowe i pokazuje różnice.",
    // DESIGN-GAP: K23 — row/section copy `fixedCosts()` (app.js) renders but `content.json` does not define:
    // Polish plural count line, the "poprzednio" meta line and the "pierwsze wystąpienie" meta line. Verbatim
    // from the prototype.
    itemForms: ["pozycja", "pozycje", "pozycji"],
    count: "{n} {items}",
    previously: "{date} · poprzednio {amount}",
    firstSeen: "pierwsze wystąpienie · {date}",
    // DESIGN-GAP: G34 — "Koszty stałe" states the kit does not define: an empty section line (the kit's three
    // sample sections always have rows) and the no-comparison-month message (US-04 AC). Placeholders; the author
    // supplies the final copy.
    changedEmpty: "Żaden koszt stały nie zmienił kwoty w tym miesiącu.",
    unchangedEmpty: "Brak kosztów stałych bez zmian w tym miesiącu.",
    newEmpty: "Brak nowych kosztów stałych w tym miesiącu.",
    noComparison: "Nie ma poprzedniego miesiąca do porównania.",
  },
  settings: {
    eyebrow: "Ustawienia / konto",
    lead: "Sprawdź dane i ustawienia prywatności.",
    loginData: "Dane logowania",
    emailLabel: "E-mail",
    passwordLabel: "Hasło",
    dataLabel: "Przetwarzanie danych",
    changePassword: "Zmień hasło",
    dangerEyebrow: "Strefa destrukcyjna",
    deleteDialogEyebrow: "Usunięcie konta",
    deleteDialogTitle: "Usunąć konto bez śladu?",
    deleteDialogBody: "Ta decyzja usunie wszystkie importy, wzorce i progi.",
    close: "Zamknij",
    // DESIGN-GAP: G23/G24 — states the kit does not define
    currentPassword: "Obecne hasło",
    passwordChanged: "Hasło zostało zmienione.",
    currentPasswordWrong: "Obecne hasło jest nieprawidłowe.",
    deleteError: "Nie udało się usunąć konta. Spróbuj ponownie.",
    deleting: "Usuwanie…",
    // DESIGN-GAP: G37 — the kit has no state for an action refused on the shared demo account (S-09, FR-014):
    // shown for `?error=demo-password` and `?error=demo-delete`.
    demoLocked: "To jest wspólne konto demo — zmiana hasła i usunięcie konta są wyłączone.",
  },
  app: {
    exit: "Wyjdź",
    sidebarView: "Widok",
    sidebarData: "Dane",
    patternsLong: "Wzorce wydatków",
    fixedLong: "Koszty stałe",
    importsLong: "Importy CSV",
    settingsLong: "Ustawienia",
    overview: "Przegląd",
    navLabel: "Nawigacja aplikacji",
  },
  landing: {
    headlineEmphasis: "rytmie.",
    stepsEyebrow: "Bez arkusza",
    stepsTitle: "Trzy kroki do jasności.",
    stepsNote: "Wystarczy jeden wieczór w miesiącu.",
    heroCardTop: "Twój miesiąc",
    heroCardSub: "wydatki rozpoznane",
    ctaTitle: ["Zobacz, gdzie cicho", "ucieka pieniądz."],
    ctaButton: "Utwórz konto",
  },
  howItWorks: {
    sequenceCaption: "Jedna granica, wiele powrotów",
    sequenceThreshold: "Twój próg",
    sequenceOver: "Ponad próg",
    stepsEyebrow: "Od pliku do obrazu",
    stepsTitle: "Trzy spokojne kroki.",
    stepsNote: "Bez ręcznego kategoryzowania.",
  },
  forWho: {
    primaryCta: "Sprawdź swój rytm",
    quoteLines: ["Nie chcę budżetu", "na każdy dzień."],
    quoteStrong: "Chcę widzieć wzorce.",
    cardsEyebrow: "Brzmi znajomo?",
    cardsTitle: "Rytm pasuje do Twojego tempa.",
    secondaryCta: "Zobacz jak działa",
  },
  // DESIGN-GAP: K11 — the empty-view paragraph is in the prototype but not in content.json (round 3).
  emptyViews: { body: "Jeden plik CSV wystarczy, aby Rytm mógł rozpoznać Twój rytm wydatków." },
} as const;

export const ICON_NAMES = [
  "overview",
  "patterns",
  "fixed",
  "import",
  "settings",
  "upload",
  "merge",
  "switch",
  "exclude",
  "edit",
  "search",
  "sort",
  "close",
  "arrow",
  "arrow-left",
  "more",
  "warning",
  "success",
  "info",
] as const;
export type IconName = (typeof ICON_NAMES)[number];
