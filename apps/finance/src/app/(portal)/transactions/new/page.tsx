import { ButtonLink, Card, Field, Input, Notice, PageHeader, Select, SubmitButton, Textarea, Toast } from "@phanet/ui";
import { createClient, getSession } from "@phanet/supabase/server";
import { CHANNEL_LABELS } from "@phanet/supabase/types";
import { listEvents, listExpenseCategories, listFunds, listOpenBudgetsWithLines, listPrograms } from "@/lib/queries";
import { canWrite, CHANNELS, toLocalInput } from "@/lib/finance";
import { MemberPicker } from "@/components/MemberPicker";
import { recordExpenseAction, recordIncomeAction, searchMembersAction } from "../actions";

export default async function NewTransactionPage({ searchParams }: { searchParams: Promise<{ kind?: string; error?: string; program?: string; budget?: string }> }) {
  const sp = await searchParams;
  const kind = sp.kind === "expense" ? "expense" : "income";
  const [session, supabase] = await Promise.all([getSession(), createClient()]);
  const roles = session?.roles ?? [];
  const [programs, events, funds, budgets, expenseCats] = await Promise.all([
    listPrograms(supabase), listEvents(supabase, 100), listFunds(supabase), listOpenBudgetsWithLines(supabase), listExpenseCategories(supabase),
  ]);
  const lineBudgets = budgets.filter((b) => b.budget_lines.some((l) => l.kind === kind));

  return (
    <>
      <PageHeader
        eyebrow="Finance · New entry"
        title="Record"
        script={kind === "income" ? "income" : "expense"}
        actions={
          <>
            <ButtonLink href="/transactions/new?kind=income" variant={kind === "income" ? "blue" : "ice"} size="sm">Income</ButtonLink>
            <ButtonLink href="/transactions/new?kind=expense" variant={kind === "expense" ? "blue" : "ice"} size="sm">Expense</ButtonLink>
          </>
        }
      />
      <Toast message={sp.error} tone="peach" />
      {!canWrite(roles) && <Notice tone="peach">Your role can review and approve, but only the finance team can record entries.</Notice>}

      <Card className="max-w-3xl">
        <form action={kind === "income" ? recordIncomeAction : recordExpenseAction} className="grid gap-4 md:grid-cols-2">
          {kind === "income" ? (
            <Field label="Fund / category">
              <Select name="category" defaultValue={funds.find((f) => f.is_active)?.slug ?? "other"} required>
                <optgroup label="Giving funds">{funds.map((f) => <option key={f.id} value={f.slug}>{f.name}{f.is_active ? "" : " (paused)"}</option>)}</optgroup>
                <optgroup label="Other income">
                  <option value="shop">Shop</option>
                  <option value="other">Other</option>
                </optgroup>
              </Select>
            </Field>
          ) : (
            <Field label="Category" hint="e.g. Venue, Sound, Transport, Refreshments">
              <Input name="category" list="expense-categories" placeholder="Transport" required />
              <datalist id="expense-categories">{expenseCats.map((c) => <option key={c} value={c} />)}</datalist>
            </Field>
          )}
          <Field label="Amount (GH₵)" hint={kind === "expense" ? "Under 2,000 → finance head · 2,000–4,999 → CEC Chair · 5,000+ → Ps. Stefan" : undefined}>
            <Input name="amount" type="number" inputMode="decimal" step="0.01" min="0.01" placeholder="0.00" required />
          </Field>
          <Field label="Channel">
            <Select name="channel" defaultValue={kind === "income" ? "momo_mtn" : "cash"} required>
              {CHANNELS.map((c) => <option key={c} value={c}>{CHANNEL_LABELS[c]}</option>)}
            </Select>
          </Field>
          <Field label="When">
            <Input name="occurred_at" type="datetime-local" defaultValue={toLocalInput()} required />
          </Field>

          {kind === "income" ? (
            <div className="md:col-span-2"><MemberPicker search={searchMembersAction} /></div>
          ) : (
            <Field label="Payee" className="md:col-span-2" hint="Who gets paid?">
              <Input name="payee_name" placeholder="Kofi Sound Services" />
            </Field>
          )}

          <Field label="Program">
            <Select name="program_id" defaultValue={sp.program ?? ""}>
              <option value="">— None —</option>
              {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </Field>
          <Field label="Event (optional)">
            <Select name="event_id" defaultValue="">
              <option value="">— None —</option>
              {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
            </Select>
          </Field>
          <Field label="Budget line (optional)" className="md:col-span-2">
            <Select name="budget_line" defaultValue="">
              <option value="">— None —</option>
              {lineBudgets.map((b) => (
                <optgroup key={b.id} label={`${b.title} · ${b.academic_year}${b.semester ? ` S${b.semester}` : ""}`}>
                  {b.budget_lines.filter((l) => l.kind === kind).map((l) => <option key={l.id} value={`${b.id}:${l.id}`}>{l.name}</option>)}
                </optgroup>
              ))}
            </Select>
          </Field>
          <Field label="Reference" hint="Receipt no. or MoMo reference. Must be unique.">
            <Input name="reference" placeholder="RCPT-0042" />
          </Field>
          <Field label="Description" className="md:col-span-2">
            <Textarea name="description" placeholder={kind === "income" ? "Sunday offering, second service" : "What was this for?"} className="!min-h-[90px]" />
          </Field>

          <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-2">
            <SubmitButton variant={kind === "income" ? "blue" : "orange"} pendingText="Saving…" disabled={!canWrite(roles)}>{kind === "income" ? "Record income" : "Submit for approval"}</SubmitButton>
            <ButtonLink href="/transactions" variant="ice">Cancel</ButtonLink>
            {kind === "income" && <span className="text-xs text-muted">Cash is saved as “counted”; MoMo, card and bank as “paid”.</span>}
          </div>
        </form>
      </Card>
    </>
  );
}
