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
    rememberMe: "Zapamiętaj mnie",
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
    // DESIGN-GAP: G19 — confirm-e-mail page has no kit copy; reuses the reset "check inbox" composition.
    confirmEmailTitle: "Sprawdź skrzynkę.",
    confirmEmailBody: "Wysłaliśmy link aktywacyjny na podany adres e-mail. Kliknij go, aby dokończyć rejestrację.",
    // DESIGN-GAP: G16 — kit has no generic registration error copy.
    registerError: "Nie udało się utworzyć konta. Sprawdź adres e-mail i spróbuj ponownie.",
    // DESIGN-GAP: G16 — no kit copy for the password-toggle button.
    showPassword: "Pokaż",
    hidePassword: "Ukryj",
    // DESIGN-GAP: G16 — kit has no field-validation copy.
    emailRequired: "Podaj poprawny adres e-mail.",
    passwordRequired: "Podaj hasło.",
    passwordTooShort: "Hasło musi mieć co najmniej 6 znaków.",
    signingIn: "Logowanie…",
    creating: "Tworzenie konta…",
    sending: "Wysyłanie…",
  },
  home: {
    emptyEyebrow: "Przegląd miesiąca",
    emptyTitle: "Zacznij od pierwszego importu.",
    emptyLead: "Rytm pokaże Ci wzorce, kiedy dostanie pierwszy wyciąg.",
    uploadCta: "+ Wgraj CSV",
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
  },
  patterns: { eyebrow: "Wzorce wydatków" },
  fixed: { eyebrow: "Koszty stałe", lead: "Rytm porównuje miesiące kalendarzowe i pokazuje różnice." },
  settings: { eyebrow: "Ustawienia / konto", lead: "Sprawdź dane i ustawienia prywatności." },
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
    cardsEyebrow: "Brzmi znajomo?",
    cardsTitle: "Rytm pasuje do Twojego tempa.",
    secondaryCta: "Zobacz jak działa",
  },
  // DESIGN-GAP: G18 — no kit copy for a view that is not available yet.
  stub: { info: "Ten widok pojawi się po pierwszym imporcie wyciągu." },
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
