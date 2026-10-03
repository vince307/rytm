import content from "../../design/rytm-os/react-kit/docs/content.json";

/** Kit copy — `design/rytm-os/react-kit/docs/content.json`, read-only. */
export const copy = content;

/**
 * Strings the prototype renders but content.json does not contain (design-kit.md K11).
 * Taken verbatim from design/rytm-os/prototype/app.js. Remove entries as the author adds keys.
 */
export const copyExtra = {
  auth: {
    // DESIGN-GAP: K13 — visual panels of confirm-email / reset-new are drawn in `app.js` but absent from content.json
    // (verbatim `confirmEmail()` / `resetNew()`).
    confirmEmailVisual: {
      eyebrow: "Jeszcze jeden krok",
      title: "Twój rytm zaczyna się od jasności.",
      lead: "Potwierdź adres e-mail, aby dokończyć tworzenie konta.",
    },
    resetNewVisual: {
      eyebrow: "Spokojnie",
      title: "Hasło można ustawić na nowo.",
      lead: "Wybierz nowe hasło, aby wrócić do swojego rytmu.",
    },
    // DESIGN-GAP: K11 — `resetNew('expired')` strings (verbatim `app.js`), content.json has only `resetNew.expired`.
    expiredEyebrow: "Link wygasł",
    expiredLead: "Dla bezpieczeństwa link do zmiany hasła działa przez ograniczony czas.",
    expiredAlert: "Wyślij nowy link, aby kontynuować.",
    // Round 2 prototype strings that content.json still lacks (design-kit.md K11, round 3):
    confirmedLogin: "E-mail potwierdzony — zaloguj się.",
    occupiedOr: "lub",
    saveNewPassword: "Zapisz nowe hasło",
    doneEyebrow: "Gotowe",
    resetSuccessLead: "Możesz teraz zalogować się do swojego rytmu.",
    // DESIGN-GAP: K11 — states the kit names but gives no copy for.
    resetNewError: "Nie udało się zmienić hasła. Spróbuj ponownie.",
    saving: "Zapisywanie…",
    resent: "Wysłaliśmy link ponownie.",
    resendError: "Nie udało się wysłać ponownie. Spróbuj za chwilę.",
  },
  home: {
    emptyEyebrow: "Przegląd miesiąca",
    emptyTitle: "Zacznij od pierwszego importu.",
    emptyLead: "Rytm pokaże Ci wzorce, kiedy dostanie pierwszy wyciąg.",
    emptyIllustrationAlt: "Dokument czekający na import",
    // DESIGN-GAP: K24 — verbatim from `prototype/app.js` `applyDashboardState` (`#/home-no-name`); the kit bakes
    // the month into the sentence ("Twój maj w jednym spokojnym widoku."), `{month}` + `monthsNominative`
    // generalise it (May reproduces the kit string byte for byte).
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
    // DESIGN-GAP: K11 — strings of prototype patterns() / patternRows() / badge() absent from content.json.
    upload: "+ Wgraj CSV",
    typeLabels: { fixed: "stały", frequent: "częsty" },
    sortPrefix: "Sortuj: ",
    footer: "{n} {patterns} · wszystkie miesiące",
    // DESIGN-GAP: K21 — detail / threshold-editor / list strings the prototype renders that content.json still
    // lacks (round 3); taken verbatim from app.js patternDetail() / thresholdEditor() / patternRows() / showToast().
    detailEyebrow: " wzorzec",
    // thresholdEditor()'s save button when no threshold is set yet; content.json's threshold.save ("Zapisz
    // próg") covers only the change path.
    setThreshold: "Ustaw próg",
    // thresholdEditor()'s onclick toast for removal (showToast('Próg usunięty.','info')).
    thresholdRemoved: "Próg usunięty.",
    // thresholdEditor()'s field label and input-suffix text; content.json's threshold object holds only the
    // button/note copy, not these.
    overBadge: "ponad próg",
    // patternRows()'s Próg-cell format for a `count` threshold and the arrow cell's aria-label; verbatim.
    thresholdCount: "{n} × / miesiąc",
    openPattern: "Otwórz wzorzec",
    occurrenceForms: ["wystąpienie", "wystąpienia", "wystąpień"],
    // DESIGN-GAP: K37 — `app.js` patternDetail() has this transactions-panel line as a literal, no content.json key.
    noTransactions: "Brak transakcji do pokazania w wybranym miesiącu.",
    // DESIGN-GAP: G31 — the kit has no label for the over-limit sum of a month other than the reference one.
    overInMonth: "Ponad progiem w {month}",
    // DESIGN-GAP: K35 — kit `patternDetail.sequenceSummary` has no plural forms ("{within} wystąpień …"); the app
    // keeps this template and fills the forms from `occurrenceForms` (kit app.js aria-label shape).
    sequenceSummary: "{within} {withinForms} w ramach progu, {over} {overForms} ponad próg",
    // Próg-cell format for a `sum` threshold — the kit's patternRows() never renders one (its five sample
    // patterns hold only count/amount thresholds), so this is a placeholder generalising the `count` format.
    thresholdSum: "{amount} / miesiąc",
    // K22: "Akcje" is the trigger label of modal('patternActions'); the kit's content.json has no key for it.
    actions: "Akcje",
    // DESIGN-GAP: G33 — the kit now draws merge, merge-empty and rename (content.json `patternActions.*`), but
    // names no screen for the lead ("Decyzje dotyczą…": read here as the detail page), no separate modal views
    // (the app reveals the forms in place) and no in-dialog errors (results are page lines); the merge field label
    // and submit are app.js literals, the rename hint has no kit text.
    mergeField: "Wzorzec",
    mergeSubmit: "Scal wzorce",
    renameHint: "Pusta nazwa przywraca nazwę z wyciągu.",
    unmerged: "Scalenie cofnięte.",
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
    loginData: "Dane logowania",
    dataLabel: "Przetwarzanie danych",
    // K15 note: the kit's settings() draws the „Sesja” row label of `.logout-row`; content.json has no key for it.
    session: "Sesja",
    // K15 note: button labels of the kit's `settings()` password toggle, not in content.json.
    savePassword: "Zapisz hasło",
    cancel: "Anuluj",
    dangerEyebrow: "Strefa destrukcyjna",
    deleteDialogEyebrow: "Usunięcie konta",
    deleteDialogTitle: "Usunąć konto bez śladu?",
    deleteDialogBody: "Ta decyzja usunie wszystkie importy, wzorce i progi.",
    close: "Zamknij",
    deleting: "Usuwanie…",
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
