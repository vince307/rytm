// Fixture gate aggregator (F-03): npm run fixture:check runs every bank's independent check and reports every
// bank, even when one fails — so a Santander break never hides whether ING is still green, and vice versa.
// The CI step (`npm run fixture:check`) is unchanged; only this script's target moved from one bank's check to
// this aggregator. Neither per-bank check script gains a side effect: each stays runnable standalone
// (`node scripts/fixture-ing-check.mjs`, `node scripts/fixture-santander-check.mjs`).

import { pathToFileURL } from "node:url";

import { check as checkIng } from "./fixture-ing-check.mjs";
import { check as checkSantander } from "./fixture-santander-check.mjs";

const BANKS = [
  ["ing", checkIng],
  ["santander", checkSantander],
];

export async function checkAll() {
  const results = [];
  for (const [bank, check] of BANKS) {
    // A check that throws (missing dir, unreadable manifest, generator assertion) still yields a per-bank
    // result, so the other bank is reported too.
    try {
      results.push([bank, await check()]);
    } catch (e) {
      results.push([bank, [`check threw: ${e instanceof Error ? e.message : String(e)}`]]);
    }
  }
  return results;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const results = await checkAll();
  let failed = false;
  for (const [bank, errors] of results) {
    if (errors.length) {
      failed = true;
      console.error(`fixture:check ${bank} FAILED (${errors.length}):`);
      for (const e of errors.slice(0, 50)) console.error(`  - ${e}`);
      if (errors.length > 50) console.error(`  … and ${errors.length - 50} more`);
    } else {
      console.log(`fixture:check ${bank} OK`);
    }
  }
  if (failed) process.exit(1);
}
