// Format detection (S-10): the one entry point the wizard calls (wired in Phase 6, ImportWizard.tsx
// readStatement). Pure module, no Node imports. Santander is tried first — a strict UTF-8 decode plus rule 1
// on line 1 (9 fields, col 0 YYYY-MM-DD, col 2 starts with `'`) — otherwise `parseIngStatement` runs
// unchanged. Once rule 1 matches, a later Santander failure (unknown-format / wrong-currency) is final and
// never falls through to the ING reader: a Santander file re-saved as cp1250 fails the strict decode and is
// rejected as unknown-format, the same way a re-saved ING file is, instead of being misread as ING
// (import-formats.md § Wykrywanie formatu, plan Critical Implementation Details).
import type { ParseError } from "@/lib/import/common";
import { buildImportPayload, parseIngStatement, type IngStatement } from "@/lib/import/ing";
import { MAX_FILE_BYTES, type ImportPayload } from "@/lib/import/schema";
import {
  buildSantanderPayload,
  looksLikeSantander,
  parseSantanderStatement,
  type SantanderStatement,
} from "@/lib/import/santander";

export type DetectResult =
  | { ok: true; bank: "ing"; statement: IngStatement }
  | { ok: true; bank: "santander"; statement: SantanderStatement }
  | { ok: false; error: ParseError };

export function detectStatement(bytes: Uint8Array, opts: { santanderAccountName: string }): DetectResult {
  if (looksLikeSantander(bytes)) {
    const result = parseSantanderStatement(bytes, { accountName: opts.santanderAccountName });
    return result.ok ? { ok: true, bank: "santander", statement: result.statement } : result;
  }
  const result = parseIngStatement(bytes);
  return result.ok ? { ok: true, bank: "ing", statement: result.statement } : result;
}

/** Dispatches to the reader whose bank produced `detected`, so callers never branch on `source` themselves. */
export function buildPayload(detected: Extract<DetectResult, { ok: true }>, accountNumber: string): ImportPayload {
  return detected.bank === "ing"
    ? buildImportPayload(detected.statement, accountNumber)
    : buildSantanderPayload(detected.statement, accountNumber);
}

/** A file-level decision the wizard shows to the user — one step wider than `ParseError`: `empty` is not a
 * parse failure (the file is a well-formed statement with no debits, D2), and `tooLarge` never reaches a
 * reader at all. */
export type FileError = "unknownFormat" | "wrongCurrency" | "empty" | "tooLarge";

/**
 * The wizard's file-level classification (S-10 Phase 6), moved out of `ImportWizard.tsx` so it is
 * unit-tested — the wizard itself has no component tests. `ImportWizard.tsx`'s `readStatement` checks
 * `file.size` on the `File` object before ever calling `file.arrayBuffer()`, so an oversized file is never
 * read into memory; this function repeats the check on `bytes.length` so it has the same contract when
 * called directly with a byte array (as the tests do).
 */
export function readImportFile(
  bytes: Uint8Array,
  opts: { santanderAccountName: string },
): { detected: Extract<DetectResult, { ok: true }> } | { error: FileError } {
  if (bytes.length > MAX_FILE_BYTES) return { error: "tooLarge" };
  const result = detectStatement(bytes, opts);
  if (!result.ok) return { error: result.error === "wrong-currency" ? "wrongCurrency" : "unknownFormat" };
  if (result.statement.accounts.every((a) => a.debits === 0)) return { error: "empty" };
  return { detected: result };
}
