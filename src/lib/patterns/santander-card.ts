// Santander card step (import-formats.md Santander rules 1–3, 5; S-11 Phase 2). Pure, import-free module that
// turns a Santander card/ATM row's (counterparty, title) into the raw merchant consumed by the patterns layer
// (src/lib/patterns/merchant.ts, which calls this before its own rule 7 / D3 operator check). An ING row's title
// never matches CARD_GATE, so it always returns null for ING rows — they fall straight through to rule 7.
//
// CARD_GATE mirrors src/lib/import/santander.ts's CARD regex's prefix and kinds only (the mask + action, not its
// amount/currency/tail capture) — a deliberate independent copy, like S-10's oracle/app reader split: that regex
// extracts `counterparty` from the raw title once, in the reader; this one only has to recognize the same gate on
// the title to decide whether `counterparty` (already extracted) is a card tail to run rules 2/3/5 over.
//
// Rules are positional by design (research Q1): the city rule (rule 3) only ever looks at the tail's current last
// token, never searches the tail by content, and runs at most three pops, each a single `if`, never a loop. Rule
// order here is load-bearing, same as `normalizeMerchant`: the result feeds `merchantKey`, and S-04/S-05 store
// thresholds/decisions keyed by it.
const CARD_GATE = /^DOP\. VISA \d{6}\*{6}\d{4} (PŁATNOŚĆ KARTĄ|WYPŁATA Z BANKOMATU KARTĄ) /;

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

/**
 * `null` unless `title` matches the card gate. ATM kind (rule 1) → `"Bankomat"`. Payment kind → rules 2, 3, 5 over
 * `counterparty` (the card tail santander.ts's `rawMerchantOf` already extracted): quotes become spaces (rule 2),
 * then up to three positional pops strip the trailing city (rule 3, minimum 1 token left, never empty). Rule 4
 * (code tokens) is Phase 3, not implemented here. `normalizeMerchant` / `merchantKey` run on the result unchanged.
 */
export function santanderCardMerchant(counterparty: string, title: string): string | null {
  const gate = CARD_GATE.exec(title);
  if (!gate) return null;
  if (gate[1] === "WYPŁATA Z BANKOMATU KARTĄ") return "Bankomat";

  const tail = counterparty.replace(/"/g, " ").trim().replace(/\s+/g, " ");
  const tokens = tail.split(" ").filter(Boolean);

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

  return tokens.join(" ");
}
