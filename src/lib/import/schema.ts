import { z } from "zod";

import { BANK_SOURCES } from "@/lib/import/banks";

// One schema for both sides of the import: the wizard builds the payload in the browser (buildImportPayload /
// the Santander reader, S-10), POST /api/imports validates it again before the `import_statement` RPC. The
// database stays the last line of defence (RLS, imports_no_overlap, amount_minor > 0, dates checked inside the
// RPC). `source` tells the endpoint which bank wrote the payload; a stale tab that posts no `source` is ING
// (the only bank before S-10), so the default keeps it importing unchanged through the deploy window.

/** Largest file the wizard accepts (checked in the browser; the file itself never reaches the server). */
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
/**
 * Largest number of debits in one import — bounds the RPC and the request body. The wizard posts multipart,
 * so the JSON travels unescaped: ~1–2 MB for 5000 real ING rows. Vercel rejects function bodies over 4.5 MB
 * with its own 413 page, which only a payload near every TEXT_MAX limit could reach.
 */
export const MAX_DEBITS = 5000;

const TEXT_MAX = 500;

const importTransactionSchema = z.object({
  occurredOn: z.iso.date(),
  amountMinor: z.number().int().positive(),
  // ING carries its own 18-digit transaction id (rule-based dedup key); Santander has none (import-formats.md
  // rule 7) — null there, enforced per-bank by the refine below.
  bankTxId: z
    .string()
    .regex(/^\d{18}$/)
    .nullable(),
  counterparty: z.string().max(TEXT_MAX),
  title: z.string().max(TEXT_MAX),
  details: z.string().max(TEXT_MAX),
});

export const importPayloadSchema = z
  .object({
    source: z.enum(BANK_SOURCES).default("ing"),
    accountNumber: z.string().regex(/^\d{26}$/),
    accountName: z.string().min(1).max(200),
    periodStart: z.iso.date(),
    periodEnd: z.iso.date(),
    transactions: z.array(importTransactionSchema).min(1).max(MAX_DEBITS),
  })
  .refine((p) => p.periodStart <= p.periodEnd, { message: "periodStart is after periodEnd", path: ["periodEnd"] })
  .refine((p) => p.transactions.every((t) => t.occurredOn >= p.periodStart && t.occurredOn <= p.periodEnd), {
    message: "transaction date outside the import period",
    path: ["transactions"],
  })
  .refine(
    (p) =>
      p.source === "ing"
        ? p.transactions.every((t) => t.bankTxId !== null)
        : p.transactions.every((t) => t.bankTxId === null),
    {
      message: "bankTxId must be set for ing and null for santander",
      path: ["transactions"],
    },
  );

export type ImportPayload = z.infer<typeof importPayloadSchema>;
