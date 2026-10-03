import content from "../../design/rytm-os/react-kit/docs/content.json";
import type { Locale } from "@/lib/i18n";
import { kitEn } from "@/content/en/kit";
import { extraEn } from "@/content/en/extra";

/** Kit copy — `design/rytm-os/react-kit/docs/content.json`, read-only. The shape every locale's kit dictionary satisfies. */
export type KitCopy = typeof content;

/** `as const` literal types widened to their primitives (tuples kept element-wise) so another locale's strings fit. */
type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends readonly unknown[]
      ? { readonly [K in keyof T]: Widen<T[K]> }
      : T extends object
        ? { [K in keyof T]: Widen<T[K]> }
        : T;

/**
 * Strings the prototype renders but content.json does not contain (design-kit.md K11).
 * Taken verbatim from design/rytm-os/prototype/app.js. Remove entries as the author adds keys.
 */
export const copyExtraPl = {
  auth: {
    // DESIGN-GAP: K13 — visual panels of confirm-email / reset-new are drawn in `app.js` but absent from content.json
    // (verbatim `confirmEmail()` / `resetNew()`).
    confirmEmailVisual: {
      eyebrow: "Jeszcze jeden krok",
      title: "Twój rytm zaczyna się od jasności.",
      lead: "Potwierdź adres e-mail, aby dokończyć tworzenie konta.",
    },
    // eyebrow / title are the kit's `auth.resetVisual`; only the lead differs from the kit's (K13).
    resetNewVisual: {
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
    // DESIGN-GAP: K39 — the kit's trend legend explains the zero mark only in a `title` literal, no content.json key.
    zeroNote: "Cienka kreska oznacza 0,00 zł",
    // DESIGN-GAP: K25 — `dashboard.stats[0].foot` is the template, the kit ships no genitive month names.
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
    // DESIGN-GAP: K38 — the „Koszty stałe” summary panel's literals live in kit `app.js`, with no `content.json`
    // key; „kosztów” is the regular genitive plural the kit never shows.
    fixedSummary: {
      link: "Zobacz zmiany",
      risen: "Podrożały",
      added: "Nowe",
      costForms: ["koszt", "koszty", "kosztów"],
    },
  },
  imports: {
    // Wizard save failure (import result `status === 'error'` in round-3 `prototype/app.js`); not in `content.json`
    // (kit gap, round-4 K-row) — `components.error` is now the read-failure line.
    saveError: "Nie udało się zapisać importu. Spróbuj ponownie.",
    // DESIGN-GAP: K11 — imports table headers the kit prototype draws but content.json lacks.
    table: { importedOn: "Data importu", debits: "Obciążenia" },
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
    lead: "Rytm porównuje miesiące kalendarzowe i pokazuje różnice.",
    // DESIGN-GAP: K23 — row/section copy `fixedCosts()` (app.js) renders but `content.json` does not define:
    // the count line, the "poprzednio" meta line and the "pierwsze wystąpienie" meta line. Verbatim from the
    // prototype (the plural forms come from `copy.fixedCosts.itemForms`).
    count: "{n} {items}",
    previously: "{date} · poprzednio {amount}",
    firstSeen: "pierwsze wystąpienie · {date}",
    // DESIGN-GAP: K40 — the delta direction word; the kit colours `.increase` / `.decrease` but names neither.
    delta: { increase: "wzrost", decrease: "spadek" },
    // DESIGN-GAP: G39 — the one empty state the kit does not define (the "Bez zmian" section with no rows).
    unchangedEmpty: "Brak kosztów stałych bez zmian w tym miesiącu.",
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
  // App chrome with no kit key (operator-facing missing-configuration banner of Layout.astro).
  config: {
    warning: "Uwaga:",
    docs: "Dokumentacja",
    supabaseMissing: "Supabase nie jest skonfigurowany — funkcje uwierzytelniania są wyłączone.",
    supabaseDocs: "Zobacz instrukcję konfiguracji",
  },
  // DESIGN-GAP: K43 — the kit has no language switcher; native names and the bilingual title are identical in both locales.
  locale: { label: "Język", pl: "Polski", en: "English", sectionTitle: "Język / Language" },
  landing: {
    // DESIGN-GAP: the kit landing mock-up amount is a literal in the prototype markup, no content.json key (register row with K42).
    heroAmount: "3 842,60 zł",
  },
} as const;

export type CopyExtra = Widen<typeof copyExtraPl>;

const dictionaries: Record<Locale, { copy: KitCopy; copyExtra: CopyExtra }> = {
  pl: { copy: content, copyExtra: copyExtraPl },
  en: { copy: kitEn, copyExtra: extraEn },
};

/** The kit copy and the kit-gap copy of one locale. */
export function getCopy(locale: Locale): { copy: KitCopy; copyExtra: CopyExtra } {
  return dictionaries[locale];
}

/** Month names of one locale: nominative and locative come from the kit's `monthNames`, genitive from `copyExtra`. */
export function getMonths(locale: Locale): {
  nominative: readonly string[];
  locative: readonly string[];
  genitive: readonly string[];
} {
  const { copy, copyExtra } = getCopy(locale);
  const monthNames = copy.patternDetail.monthNames;
  return {
    nominative: Object.keys(monthNames),
    locative: Object.values(monthNames),
    genitive: copyExtra.home.monthsGenitive,
  };
}

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
