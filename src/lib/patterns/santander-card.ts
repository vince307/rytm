// Santander card step (S-11 plan, Critical Implementation Details rules 1–5; import-formats.md § Normalizacja
// sprzedawcy). Pure, import-free module that turns a Santander card/ATM/BLIK-withdrawal row's (counterparty,
// title) into the raw merchant consumed by the patterns layer (src/lib/patterns/merchant.ts, which calls this
// before its own rule 7 / D3 operator check).
// An ING row's title never matches CARD_GATE or BLIK_GATE, so it always returns null for ING rows — they fall
// straight through to rule 7.
//
// CARD_GATE mirrors src/lib/import/santander.ts's CARD regex's prefix and kinds only (the mask + action, not its
// amount/currency/tail capture) — a deliberate independent copy, like S-10's oracle/app reader split: that regex
// extracts `counterparty` from the raw title once, in the reader; this one only has to recognize the same gate on
// the title to decide whether `counterparty` (already extracted) is a card tail to run rules 2/3/4/5 over.
//
// BLIK_GATE (Phase 3) is a separate, independent top-level gate, checked only when CARD_GATE does not match: a
// Santander BLIK cash withdrawal title always ends in `:<11 digits>` (import-formats.md `Wypłata BLIK <tekst>:<11
// cyfr>`), the same end shape the fixture's `Wypłata BLIK WYPLATA GOTOWKI:<11 digits>` and the real
// ` ... ref:<11 digits>` shape both satisfy. A bare `startsWith("Wypłata BLIK")` would also match an ING BLIK cash
// withdrawal title (which has no `:<11 digits>` end), so the full regex match — including that end — is what keeps
// ING rows falling through to `null` instead of being claimed here.
//
// Rules are positional by design (research Q1): the city rule (rule 3) only ever looks at the tail's current last
// token, never searches the tail by content, and runs at most three pops, each a single `if`, never a loop. Rule
// order here is load-bearing, same as `normalizeMerchant`: the result feeds `merchantKey`, and S-04/S-05 store
// thresholds/decisions keyed by it.
const CARD_GATE = /^DOP\. VISA \d{6}\*{6}\d{4} (PŁATNOŚĆ KARTĄ|WYPŁATA Z BANKOMATU KARTĄ) /;

/** Phase 3: Santander's own BLIK cash-withdrawal title shape — the bank-specific `:<11 digits>` end, not merely
 * the (bank-neutral) "Wypłata BLIK" phrase, so an ING BLIK withdrawal title never matches. */
const BLIK_GATE = /^Wypłata BLIK .+:\d{11}$/;

/** Rule 3: upper-cased first tokens of a two-word Polish city name, checked against the tail's second-to-last
 * token after the city itself is popped. */
const CITY_PREFIX = new Set([
  "NOWY",
  "NOWA",
  "NOWE",
  "STARY",
  "STARA",
  "STARE",
  "BIALA",
  "BIALY",
  "BIALE",
  "ZIELONA",
  "ZIELONY",
  "SUCHA",
  "DABROWA",
  "LOS",
  "SAN",
]);

// Rule 4 (Phase 3): a store/till code token — e.g. `A12`, `K.3`, a bare `#` — is descriptor noise that splits one
// merchant on real data (research R10; the first-token exemption is plan review F2); a glued `<WORD><digits>`
// token (e.g. a till number stuck to the word before it, no space) is noise too, but only its digit tail is
// noise — the word stays.
const CODE_TOKEN = /^[A-Z]{0,2}\d[\dA-Z]*\.?$/i;
const K_DOT_TOKEN = /^K\.\d+\.?$/i;
// Guards a code-shaped token that follows an explicit "NR"/"NO" label (store/till number), e.g. `SKLEP NR 12` —
// kept, not dropped. Only protects 1–2-digit numbers in practice: `normalizeMerchant`'s `STORE_NUMBER` (global,
// ING-shared) still drops a kept ≥3-digit number afterwards — a known, accepted risk (plan), not fixed here.
const NR_GUARD = /^(NR|NO)\.?$/i;
const GLUED_DIGITS = /^([A-Za-z]{3,})\d{3,}$/;

/**
 * Rule 4: drop each non-first token matching a store/till code shape (`CODE_TOKEN`, `K_DOT_TOKEN`, or a bare `#`),
 * unless the previous token is an explicit `NR`/`NO` label (`NR_GUARD`) — the first token is never dropped, since
 * a leading code-shaped token (`4F`, `5`) is a brand name, not a store code. A surviving token glued to a run of
 * digits (`GLUED_DIGITS`) loses the digit tail. If every token would be dropped, the (pre-rule-4) tokens are kept
 * unchanged instead — never return an empty tail.
 */
function dropCodeTokens(tokens: readonly string[]): string[] {
  const kept: string[] = [];
  tokens.forEach((token, i) => {
    const isCode = token === "#" || CODE_TOKEN.test(token) || K_DOT_TOKEN.test(token);
    const guarded = i > 0 && NR_GUARD.test(tokens[i - 1]);
    if (isCode && i > 0 && !guarded) return;
    const glued = GLUED_DIGITS.exec(token);
    kept.push(glued ? glued[1] : token);
  });
  return kept.length > 0 ? kept : [...tokens];
}

/**
 * `null` unless `title` matches the card gate or the BLIK withdrawal gate. ATM kind (rule 1) → `"Bankomat"`. BLIK
 * cash withdrawal (`BLIK_GATE`) → `"Wypłata BLIK"`, whatever the counterparty. Payment kind → rules 2, 3, 4, 5 over
 * `counterparty` (the card tail santander.ts's `rawMerchantOf` already extracted): quotes become spaces (rule 2),
 * then up to three positional pops strip the trailing city (rule 3, minimum 1 token left, never empty), then
 * `dropCodeTokens` removes store/till code noise (rule 4). `normalizeMerchant` / `merchantKey` run on the result
 * unchanged.
 */
export function santanderCardMerchant(counterparty: string, title: string): string | null {
  const gate = CARD_GATE.exec(title);
  if (!gate) return BLIK_GATE.test(title) ? "Wypłata BLIK" : null;
  if (gate[1] === "WYPŁATA Z BANKOMATU KARTĄ") return "Bankomat";

  const tail = counterparty.replace(/"/g, " ").trim().replace(/\s+/g, " ");
  let tokens = tail.split(" ").filter(Boolean);

  if (tokens.length > 1) {
    const city = tokens[tokens.length - 1];
    tokens.pop();
    if (tokens.length > 1 && CITY_PREFIX.has(tokens[tokens.length - 1].toUpperCase())) {
      tokens.pop();
    }
    if (tokens.length > 1 && tokens[tokens.length - 1].toLowerCase() === city.toLowerCase()) {
      tokens.pop();
    }
  }

  tokens = dropCodeTokens(tokens);

  return tokens.join(" ");
}
