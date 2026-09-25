import { z } from "zod";

// One schema for both sides of the import: the wizard builds the payload in the browser (buildImportPayload),
// POST /api/imports validates it again before the RPC. The database stays the last line of defence
// (RLS, imports_no_overlap, amount_minor > 0, dates checked inside import_ing_statement).

/** Largest file the wizard accepts (checked in the browser; the file itself never reaches the server). */
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
/** Largest number of debits in one import — bounds the RPC and the request body (~1 MB). */
export const MAX_DEBITS = 5000;

const TEXT_MAX = 500;

const importTransactionSchema = z.object({
  occurredOn: z.iso.date(),
  amountMinor: z.number().int().positive(),
  bankTxId: z.string().regex(/^\d{18}$/),
  counterparty: z.string().max(TEXT_MAX),
  title: z.string().max(TEXT_MAX),
  details: z.string().max(TEXT_MAX),
});

export const importPayloadSchema = z
  .object({
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
  });

export type ImportPayload = z.infer<typeof importPayloadSchema>;
