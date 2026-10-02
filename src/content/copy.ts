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
    // DESIGN-GAP: K25 / K29 — round 3 ships `dashboard.stats[].foot` templates, but no genitive months and „{n} {items}
    // podrożały” is wrong for n = 1 (K29 in design-kit.md); the app keeps these templates until the kit foot is grammatical.
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
    // Wizard save failure (import result `status === 'error'` in round-3 `prototype/app.js`); not in `content.json`
    // (kit gap, round-4 K-row) — `components.error` is now the read-failure line.
    saveError: "Nie udało się zapisać importu. Spróbuj ponownie.",
    // DESIGN-GAP: K11 — imports table headers the kit prototype draws but content.json lacks.
    table: { importedOn: "Data importu", debits: "Obciążenia" },
    // Santander's export has no account name column (the owner's name, header col 3, is never stored, R2);
    // "Rachunek" is the kit's own word (`imports.santanderAccountName`), sent by the wizard as the stored name.
    santanderAccountName: "Rachunek",
    // Result screen (prototype importResult()); the eyebrow is the kit's `importFlow.result`.
    toPatterns: "Zobacz wzorce",
    toOverview: "Przejdź do przeglądu",
    transactionForms: ["transakcja", "transakcje", "transakcji"],
    // DESIGN-GAP: K11 — the kit result panel's „Transakcje” label has no content.json key (`importFlow.transactions`
    // is the genitive plural „transakcji”).
    transactionsLabel: "Transakcje",
    // DESIGN-GAP: K11 — the kit result h1 („Dodaliśmy 64 obciążenia.”) is built in the prototype script, not in
    // content.json.
    resultTitle: "Dodaliśmy {n} {debits}.",
    debitForms: ["obciążenie", "obciążenia", "obciążeń"],
    next: "Dalej",
    stepEyebrow: "Nowy import · krok {n} z 3",
    accountTitle: "Wybierz rachunek.",
    // The prototype spells the count as a word („trzy rachunki”); the app interpolates the number.
    accountLead: "Ten plik zawiera {n} {accounts}. Domyślnie zaznaczyliśmy ten z największą liczbą transakcji.",
    accountForms: ["rachunek", "rachunki", "rachunków"],
    selected: "wybrane",
    summaryTitle: "Sprawdź przed importem.",
    summary: {
      debits: "Obciążenia do importu",
    },
    overlapTail: "Wybierz inny plik albo wróć do importów.",
    // DESIGN-GAP: K19 — content.json has no key for the delete dialog eyebrow (kit modal('deleteImport')).
    deleteDialogEyebrow: "Cofnij import",
  },
  patterns: {
    eyebrow: "Wzorce wydatków",
    // DESIGN-GAP: K11 — strings of prototype patterns() / patternRows() / badge() absent from content.json.
    upload: "+ Wgraj CSV",
    typeLabels: { fixed: "stały", frequent: "częsty" },
    sortPrefix: "Sortuj: ",
    footer: "{n} {patterns} · wszystkie miesiące",
    patternForms: ["wzorzec", "wzorce", "wzorców"],
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
