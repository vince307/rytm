# Follow-ups — santander-card-merchants (S-11)

Written by `/10x-plan` (run 2026-10-01-m2-santander). Candidates not taken into the plan.

## FU1 — Santander BLIK through a payment operator

`Zakup BLIK` rows paid through an operator carry the operator (with its address) in col 3, so the merchant is the
operator; the ING D3 domain rule (`src/lib/patterns/merchant.ts` `rawMerchant`, `Nr transakcji`) does not apply.
Trigger: Santander BLIK operator rows seen in a real import, or a slice touching `rawMerchant`'s operator rule.

## FU2 — Fixture ST06 with a second ATM address

`scripts/fixture-santander.mjs` `buildST06` has one fixed counterparty; real `Wypłata BLIK` rows carry the ATM
address. A second address would let the oracle prove the `Wypłata BLIK` one-pattern rule (`santander-card.ts`).
Trigger: next change to `scripts/fixture-santander.mjs`.

## FU3 — Cross-bank join for names with Polish letters

Santander card tails are ASCII, ING keeps diacritics, so `merchantKey` joins only ASCII names. Folding would re-key
ING (`merchantKey`). Trigger: a real ING + Santander import shows the same merchant split by diacritics.

## FU4 — min 2 fallback for the city rule

`santander-card.ts` strips the city down to 1 token; a generic one-word name in two towns merges irreversibly. The
same fallback applies to the `CITY_PREFIX` pop (require ≥ 2 tokens left; +1 real split measured at plan review).
Trigger: owner reports a wrong cross-town merge ([human] 4.11 rejected).

## FU5 — Re-key saved thresholds/decisions on old Santander keys

`pattern_thresholds` / `pattern_decisions` rows saved on S-10 raw-tail keys are orphaned by S-11.
Trigger: owner rejects S-10 [human] 6.11 / S-11 [human] 4.9, or production rows exist on Santander keys.
