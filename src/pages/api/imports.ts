import type { APIRoute } from "astro";
import { DEMO_EMAIL } from "astro:env/server";
import { createClient } from "@/lib/supabase";
import { importPayloadSchema } from "@/lib/import/schema";
import { DEMO_ERROR, demoImportAllowed, isDemoEmail } from "@/lib/demo";

export const prerender = false;

// Saves one ING import (S-01). The wizard parses the file in the browser and posts only the debits of the
// chosen account as JSON in the `payload` field; the file itself never reaches the server. The payload is
// validated again here, then `import_ing_statement` writes the import and its transactions atomically
// (security invoker: RLS, the user_id default and imports_no_overlap apply). Errors go back to the wizard
// as `/imports/new?error=<code>`.
export const POST: APIRoute = async (context) => {
  const supabase = createClient(context.request.headers, context.cookies);
  if (!supabase) {
    return context.redirect("/login");
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return context.redirect("/login");
  }
  // S-09: the demo account is shared and public — only its first (seeding) import passes; a failed count fails closed.
  if (isDemoEmail(user.email, DEMO_EMAIL)) {
    const { count, error: countError } = await supabase.from("imports").select("id", { count: "exact", head: true });
    if (countError || !demoImportAllowed(count ?? 1)) {
      return context.redirect(DEMO_ERROR.import);
    }
  }

  let json: unknown;
  try {
    // formData() throws on a body that is not a form (e.g. application/json) — that is an invalid payload too.
    const raw = (await context.request.formData()).get("payload");
    json = typeof raw === "string" ? JSON.parse(raw) : undefined;
  } catch {
    json = undefined;
  }
  const parsed = importPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return context.redirect("/imports/new?error=invalid");
  }
  const p = parsed.data;

  const { data: id, error } = await supabase.rpc("import_ing_statement", {
    p_account_number: p.accountNumber,
    p_account_name: p.accountName,
    p_period_start: p.periodStart,
    p_period_end: p.periodEnd,
    p_transactions: p.transactions.map((t) => ({
      occurred_on: t.occurredOn,
      amount_minor: t.amountMinor,
      bank_tx_id: t.bankTxId,
      counterparty: t.counterparty,
      title: t.title,
      details: t.details,
    })),
  });

  if (error?.code === "23P01") {
    // imports_no_overlap (FR-005, per account): read the existing import this range collides with (RLS limits
    // it to the caller's own imports) so the wizard can name its real dates instead of parsing error.details.
    const { data: existing } = await supabase
      .from("imports")
      .select("period_start, period_end")
      .eq("account_number", p.accountNumber)
      .lte("period_start", p.periodEnd)
      .gte("period_end", p.periodStart)
      .order("period_start")
      .limit(1)
      .maybeSingle();
    const query = new URLSearchParams({ error: "overlap" });
    if (existing) {
      query.set("from", existing.period_start);
      query.set("to", existing.period_end);
    }
    return context.redirect(`/imports/new?${query.toString()}`);
  }
  if (error || !id) {
    // eslint-disable-next-line no-console -- server-side only; the runtime log is the one place this error is visible
    console.error("imports failed", error?.code, error?.message);
    return context.redirect("/imports/new?error=failed");
  }
  return context.redirect(`/imports/result?id=${encodeURIComponent(id)}`);
};
