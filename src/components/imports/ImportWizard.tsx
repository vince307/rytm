// Import wizard (S-01) — prototype importsNew / uploadReady / importAccount / importSummary (app.js:57–61).
// The file is parsed here, in the browser, and never leaves it: step 3 posts only the debits of the chosen
// account (buildImportPayload) as JSON to /api/imports. Steps 2–3 live in this island's state on /imports/new,
// so a refresh starts over at step 1. The overlap check in step 3 is UX only — imports_no_overlap in the
// database is the guarantee (FR-005); a rejected POST comes back as ?error= and is shown in step 1.
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode, Ref } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ServerError } from "@/components/auth/ServerError";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Stepper } from "@/components/app/Stepper";
import { Glyph } from "@/components/Glyph";
import type { copy, copyExtra } from "@/content/copy";
import { buildImportPayload, parseIngStatement } from "@/lib/import/ing";
import type { IngParseResult, IngStatement } from "@/lib/import/ing";
import { MAX_DEBITS, MAX_FILE_BYTES, importPayloadSchema } from "@/lib/import/schema";
import { formatAccountTail, formatRangeLong, formatRangeShort, plural } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface ImportWizardLabels {
  flow: Pick<typeof copy.importFlow, "title" | "steps" | "supported" | "oneAccount">;
  imports: typeof copyExtra.imports;
  errors: typeof copy.importErrors;
  /** `copy.components.error` — a save that failed for a reason the user cannot act on. */
  genericError: string;
}

export interface ExistingImport {
  accountNumber: string;
  periodStart: string;
  periodEnd: string;
}

export interface WizardServerError {
  kind: "overlap" | "invalid" | "failed" | "demo";
  /** The colliding import's range; missing when the endpoint could not read it back. */
  from?: string;
  to?: string;
}

interface Props {
  labels: ImportWizardLabels;
  /** The caller's own imports (RLS) — step 3 checks the chosen account's range against them. */
  existing: ExistingImport[];
  serverError?: WizardServerError;
}

type Step = 1 | 2 | 3;
type FileError = "unknownFormat" | "wrongCurrency" | "empty";
interface Loaded {
  fileName: string;
  statement: IngStatement;
}

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));

// Prototype .panel
const panel = "border-line bg-paper rounded-xl border p-[22px] max-[559px]:p-[17px]";
// Prototype .flow-actions — wraps on a phone so two ghost buttons never push the page sideways.
const flowActions = "mt-[25px] flex flex-wrap justify-end gap-2.5";
// Prototype .import-errors .text-button
const textButton = "text-excess-text ml-1.5 inline cursor-pointer p-0 text-xs font-extrabold underline";

async function readStatement(file: File): Promise<{ statement: IngStatement } | { error: FileError }> {
  // DESIGN-GAP: G27 — the kit has no message for a file over the size limit; `unknownFormat` stands in.
  if (file.size > MAX_FILE_BYTES) return { error: "unknownFormat" };
  let result: IngParseResult;
  try {
    result = parseIngStatement(new Uint8Array(await file.arrayBuffer()));
  } catch {
    return { error: "unknownFormat" };
  }
  if (!result.ok) return { error: result.error === "wrong-currency" ? "wrongCurrency" : "unknownFormat" };
  if (result.statement.accounts.every((a) => a.debits === 0)) return { error: "empty" };
  return { statement: result.statement };
}

/** Kit error copy leads with a bold sentence („<strong>Nieznany format pliku.</strong> Obsługujemy: …”). */
function Headline({ text }: { text: string }) {
  const end = text.indexOf(". ");
  if (end < 0) return <>{text}</>;
  return (
    <>
      <strong>{text.slice(0, end + 1)}</strong> {text.slice(end + 2)}
    </>
  );
}

// Prototype .dash-title — the markup of PageTitle.astro; the title changes with the step, so the island owns it.
function StepTitle({
  eyebrow,
  title,
  lead,
  headingRef,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  headingRef: Ref<HTMLHeadingElement>;
  children?: ReactNode;
}) {
  return (
    <div className="mb-7 flex items-end justify-between gap-5 max-[899px]:items-start">
      <div>
        <div className="text-excess-text text-xs font-extrabold tracking-[0.14em] uppercase">{eyebrow}</div>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-2 mb-1 text-[37px] tracking-[-0.07em] outline-none max-[899px]:text-[31px]"
        >
          {title}
        </h1>
        <p className="text-muted text-sm">{lead}</p>
      </div>
      {children}
    </div>
  );
}

export default function ImportWizard({ labels, existing, serverError }: Props) {
  const { flow, imports: x, errors } = labels;
  const [step, setStep] = useState<Step>(1);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [fileError, setFileError] = useState<FileError | null>(null);
  const [pageError, setPageError] = useState<WizardServerError | null>(serverError ?? null);
  const [account, setAccount] = useState("");
  // A native POST to a URL never sets useFormStatus().pending, so the lock against a double submit is ours;
  // a second POST would land on imports_no_overlap and report a successful import as an overlap.
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // A step replaces the whole view — move focus to its heading so keyboard and screen-reader users follow.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const statement = loaded?.statement;
  const chosen = statement?.accounts.find((a) => a.number === account);
  // The endpoint validates with the same schema; checking here keeps a file that breaks it (e.g. a bank
  // transaction number that is not 18 digits) from reaching a ready step 3 and failing only after the POST.
  const { payload, payloadValid } = useMemo(() => {
    if (step !== 3 || !statement || !chosen) return { payload: "", payloadValid: false };
    const built = buildImportPayload(statement, chosen.number);
    return { payload: JSON.stringify(built), payloadValid: importPayloadSchema.safeParse(built).success };
  }, [step, statement, chosen]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setPageError(null);
    setStep(1);
    const result = await readStatement(file);
    if ("error" in result) {
      setLoaded(null);
      setFileError(result.error);
      return;
    }
    setFileError(null);
    setLoaded({ fileName: file.name, statement: result.statement });
    setAccount(result.statement.defaultAccountNumber);
  }

  function openPicker() {
    inputRef.current?.click();
  }

  // Prototype: „Wybierz inny plik” in step 3 goes back to step 1; here it also opens the picker right away.
  function chooseOther() {
    setStep(1);
    setLoaded(null);
    setFileError(null);
    openPicker();
  }

  const chooseOtherButton = (
    <button type="button" className={textButton} onClick={openPicker}>
      {errors.chooseOther}
    </button>
  );

  const overlapMessage = (from?: string, to?: string) =>
    from && to ? (
      <>
        {x.overlapPrefix}{" "}
        <a href="/imports" className="underline">
          {formatRangeLong(from, to)}
        </a>
        . {x.overlapTail}
      </>
    ) : (
      <>
        {x.overlapPrefix.replace(/:$/, ".")} {x.overlapTail}
      </>
    );

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept=".csv"
      hidden
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        void handleFile(file);
      }}
    />
  );

  if (step === 1 || !statement || !chosen) {
    const serverMessage =
      pageError?.kind === "overlap" ? (
        overlapMessage(pageError.from, pageError.to)
      ) : pageError?.kind === "invalid" ? (
        // DESIGN-GAP: G27 — the kit has no message for a payload the server rejected; `unknownFormat` stands in.
        <Headline text={errors.unknownFormat} />
      ) : pageError?.kind === "failed" ? (
        labels.genericError
      ) : pageError?.kind === "demo" ? (
        // DESIGN-GAP: G37 — the kit has no state for an import refused on the shared demo account (S-09).
        x.demoLocked
      ) : null;

    return (
      <>
        {fileInput}
        <StepTitle eyebrow={x.newEyebrow} title={flow.title} lead={x.newLead} headingRef={headingRef}>
          <a
            href="/imports"
            className="text-ink inline-flex items-center gap-1.5 text-[13px] font-extrabold no-underline"
          >
            <Glyph name="arrow-left" size={15} /> {x.back}
          </a>
        </StepTitle>
        <Stepper steps={flow.steps} current={1} />
        <ServerError className="mb-[15px] max-w-[760px]" message={serverMessage}>
          {chooseOtherButton}
          <a href="/imports" className={textButton}>
            {errors.back}
          </a>
        </ServerError>
        <section
          className={cn(
            panel,
            "border-muted flex min-h-[360px] flex-col items-center justify-center border-dashed text-center",
          )}
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            void handleFile(e.dataTransfer.files[0]);
          }}
        >
          <div className="bg-ink text-paper grid size-[60px] place-items-center rounded-[13px]">
            <Glyph name="upload" size={28} />
          </div>
          <h2 className="mt-[22px] mb-2 text-[23px] tracking-[-0.04em]">{x.dropTitle}</h2>
          <p className="text-muted mb-[22px] text-[13px]">{flow.supported}</p>
          <Button type="button" variant="primary" onClick={openPicker}>
            {x.choose}
          </Button>
          {loaded && (
            <div className="bg-paper-soft text-muted mt-[25px] flex items-center gap-[9px] rounded-lg px-3.5 py-[11px] text-xs">
              <Glyph name="success" className="text-green" />
              <span className="min-w-0 [overflow-wrap:anywhere]">
                {loaded.fileName} · {x.formatRecognised}
              </span>
              <button
                type="button"
                className="text-ink inline-flex cursor-pointer items-center gap-1 py-[5px] text-xs font-extrabold"
                onClick={() => {
                  setStep(2);
                }}
              >
                {x.next} <Glyph name="arrow" size={14} />
              </button>
            </div>
          )}
        </section>
        {fileError && (
          <section className="mt-[15px] grid max-w-[760px] gap-2.5">
            <ServerError className="mb-0" message={<Headline text={errors[fileError]} />}>
              {chooseOtherButton}
            </ServerError>
          </section>
        )}
      </>
    );
  }

  if (step === 2) {
    const n = statement.accounts.length;
    return (
      <>
        {fileInput}
        <StepTitle
          eyebrow={fill(x.stepEyebrow, { n: 2 })}
          title={x.accountTitle}
          lead={fill(x.accountLead, { n, accounts: plural(n, x.accountForms) })}
          headingRef={headingRef}
        />
        <section className={cn(panel, "max-w-[700px]")}>
          <div role="radiogroup" aria-label={x.accountTitle}>
            {statement.accounts.map((a) => (
              <label key={a.number} className="border-line flex cursor-pointer items-center gap-3.5 border-b py-[19px]">
                <input
                  type="radio"
                  name="account"
                  value={a.number}
                  checked={a.number === account}
                  onChange={() => {
                    setAccount(a.number);
                  }}
                  className="accent-ink"
                />
                <span className="min-w-0 flex-1">
                  <strong className="block text-sm">
                    {a.name} · {formatAccountTail(a.number)}
                  </strong>
                  <small className="text-muted mt-1 block text-xs">
                    {x.bankName} · {a.rows} {plural(a.rows, x.transactionForms)}
                  </small>
                </span>
                {a.number === account && <b className="text-green text-[11px]">{x.selected}</b>}
              </label>
            ))}
          </div>
          <div className={flowActions}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setStep(1);
              }}
            >
              {x.stepBack}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setStep(3);
              }}
            >
              {x.next} <span aria-hidden="true">↗</span>
            </Button>
          </div>
        </section>
      </>
    );
  }

  const { period } = statement;
  // Same test as imports_no_overlap: same account, closed ranges sharing at least one day.
  const overlap = existing
    .filter((e) => e.accountNumber === chosen.number && e.periodStart <= period.end && e.periodEnd >= period.start)
    .sort((a, b) => a.periodStart.localeCompare(b.periodStart))[0] as ExistingImport | undefined;
  const blocking = overlap ? (
    overlapMessage(overlap.periodStart, overlap.periodEnd)
  ) : chosen.debits === 0 ? (
    <Headline text={errors.empty} />
  ) : chosen.debits > MAX_DEBITS ? (
    // DESIGN-GAP: G27 — the kit has no message for "too many debits in one import"; `unknownFormat` stands in.
    <Headline text={errors.unknownFormat} />
  ) : !payloadValid ? (
    // DESIGN-GAP: G27 — the kit has no message for "file inconsistent with the import contract"; `unknownFormat` stands in.
    <Headline text={errors.unknownFormat} />
  ) : null;

  return (
    <>
      {fileInput}
      <StepTitle
        eyebrow={fill(x.stepEyebrow, { n: 3 })}
        title={x.summaryTitle}
        lead={flow.oneAccount}
        headingRef={headingRef}
      />
      <section className={cn(panel, "max-w-[760px]")}>
        <dl className="mb-6 grid grid-cols-2 gap-[21px] max-[899px]:grid-cols-1">
          {[
            [
              x.summary.account,
              // ING only until the wizard reads the detector's bank (Phase 6); the fixed key keeps this
              // compiling against copy.ts's new per-bank `accountLabel` shape.
              `${fill(x.accountLabel.ing, { name: chosen.name })} · ${formatAccountTail(chosen.number)}`,
            ],
            [x.summary.range, formatRangeShort(period.start, period.end)],
            [x.summary.debits, `${chosen.debits} ${plural(chosen.debits, x.transactionForms)}`],
            [x.summary.skipped, `${chosen.credits} ${plural(chosen.credits, x.transactionForms)}`],
          ].map(([term, value]) => (
            <div key={term}>
              <dt className="text-muted mb-1.5 block text-xs">{term}</dt>
              <dd className="m-0 text-sm font-bold [overflow-wrap:anywhere]">{value}</dd>
            </div>
          ))}
        </dl>
        {blocking ? (
          <>
            <ServerError className="mb-0" message={blocking} />
            <div className={flowActions}>
              <Button type="button" variant="ghost" onClick={chooseOther}>
                {errors.chooseOther}
              </Button>
              <a href="/imports" className={buttonVariants({ variant: "ghost" })}>
                {errors.back}
              </a>
            </div>
          </>
        ) : (
          // DESIGN-GAP: G25 — the kit's step 3 has no "range is free → confirm" state; placeholder button.
          <form
            method="POST"
            action="/api/imports"
            // multipart sends the JSON as-is; url-encoding would triple its punctuation and grow Polish letters ×6.
            encType="multipart/form-data"
            onSubmit={(event) => {
              if (submitting) {
                event.preventDefault();
                return;
              }
              setSubmitting(true);
            }}
          >
            <input type="hidden" name="payload" value={payload} />
            <div className={flowActions}>
              <Button
                type="button"
                variant="ghost"
                disabled={submitting}
                onClick={() => {
                  setStep(2);
                }}
              >
                {x.stepBack}
              </Button>
              <SubmitButton size="default" pendingText={x.importing} pending={submitting}>
                {fill(x.confirm, { n: chosen.debits, debits: plural(chosen.debits, x.debitForms) })}
              </SubmitButton>
            </div>
          </form>
        )}
      </section>
    </>
  );
}
