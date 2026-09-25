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
    accountLabel: "ING · {name}",
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
  },
  fixed: { eyebrow: "Koszty stałe", lead: "Rytm porównuje miesiące kalendarzowe i pokazuje różnice." },
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
