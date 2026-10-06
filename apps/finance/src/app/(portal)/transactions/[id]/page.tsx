import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink, Card, ConfirmSubmit, Field, Input, Label, Notice, PageHeader, Select, SubmitButton, Textarea, Toast } from "@phanet/ui";
import { createClient, getSession } from "@phanet/supabase/server";
import { fmtDateTime, money } from "@phanet/supabase/format";
import { CHANNEL_LABELS } from "@phanet/supabase/types";
import { getTransaction, listEvents, listExpenseCategories, listFunds, listOpenBudgetsWithLines, listPrograms, profileNames } from "@/lib/queries";
import { approverLabel, canDecide, canDisburse, canWrite, CHANNELS, counterparty, isAdmin, toLocalInput } from "@/lib/finance";
import { StatusBadge } from "@/components/StatusBadge";
import { Amount } from "@/components/TxTable";
import { DecideForm } from "@/components/DecideForm";
import { MemberPicker } from "@/components/MemberPicker";
import { deleteTransactionAction, markPaidAction, searchMembersAction, updateTransactionAction } from "../actions";

export default async function TransactionDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [session, supabase] = await Promise.all([getSession(), createClient()]);
  const roles = session?.roles ?? [];
  const tx = await getTransaction(supabase, id);
  if (!tx) notFound();

  const editable = canWrite(roles) && (tx.kind === "income" || tx.status === "pending");
  const [names, programs, events, funds, budgets, expenseCats] = await Promise.all([
    profileNames(supabase, [tx.recorded_by, tx.approved_by]),
    editable ? listPrograms(supabase) : Promise.resolve([]),
    editable ? listEvents(supabase, 100) : Promise.resolve([]),
    editable && tx.kind === "income" ? listFunds(supabase) : Promise.resolve([]),
    editable ? listOpenBudgetsWithLines(supabase) : Promise.resolve([]),
    editable && tx.kind === "expense" ? listExpenseCategories(supabase) : Promise.resolve([]),
  ]);
  const self = `/transactions/${tx.id}`;
  const isExpense = tx.kind === "expense";
  const lineBudgets = budgets.filter((b) => b.budget_lines.some((l) => l.kind === tx.kind));
  const fundSlugs = funds.map((f) => f.slug);
  const incomeCategoryKnown = fundSlugs.includes(tx.category) || tx.category === "shop" || tx.category === "other";

  const steps: { label: string; detail: string; done: boolean; tone?: "ember" }[] = [
    { label: "Recorded", detail: `${fmtDateTime(tx.created_at)}${tx.recorded_by ? ` · ${names[tx.recorded_by] ?? "team"}` : tx.source !== "manual" ? ` · via ${tx.source}` : ""}`, done: true },
  ];
  if (isExpense) {
    const decided = tx.status === "approved" || tx.status === "rejected" || tx.status === "paid";
    steps.push({
      label: tx.status === "rejected" ? "Rejected" : "Approved",
      detail: decided ? `${fmtDateTime(tx.approved_at)}${tx.approved_by ? ` · ${names[tx.approved_by] ?? "approver"}` : ""}${tx.decision_note ? ` · “${tx.decision_note}”` : ""}` : `Awaiting ${approverLabel(tx.approver_role)}`,
      done: decided, tone: tx.status === "rejected" ? "ember" : undefined,
    });
    if (tx.status !== "rejected") steps.push({ label: "Paid out", detail: tx.status === "paid" ? `${fmtDateTime(tx.paid_at)} · ${CHANNEL_LABELS[tx.channel]}` : "Not yet disbursed", done: tx.status === "paid" });
  } else {
    steps.push({ label: tx.status === "counted" ? "Counted" : "Paid", detail: `${fmtDateTime(tx.occurred_at)} · ${CHANNEL_LABELS[tx.channel]}`, done: true });
  }

  return (
    <>
      <PageHeader
        eyebrow={`Finance · ${isExpense ? "Expense" : "Income"}`}
        title={counterparty(tx)}
        actions={
          <>
            <ButtonLink href="/transactions" variant="ice" size="sm">← Ledger</ButtonLink>
            {isExpense && <ButtonLink href="/approvals" variant="ice" size="sm">Approvals</ButtonLink>}
          </>
        }
      />
      <Toast message={sp.ok} tone="mint" />
      <Toast message={sp.error} tone="peach" />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-6 min-w-0">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
              <div>
                <Label tone="orange">Amount</Label>
                <div className="num-xl mt-1"><Amount tx={tx} /></div>
              </div>
              <StatusBadge tx={tx} className="!text-[11px] !px-3 !py-2" />
            </div>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 text-sm">
              <Row k="Category" v={tx.category} />
              <Row k="Channel" v={CHANNEL_LABELS[tx.channel]} />
              <Row k="Occurred" v={fmtDateTime(tx.occurred_at)} />
              <Row k="Source" v={tx.source} />
              {isExpense ? <Row k="Payee" v={tx.payee_name ?? "—"} /> : <Row k="Payer" v={tx.payer_name ?? "Anonymous"} />}
              {!isExpense && <Row k="Member" v={tx.member_id ? <span className="font-mono text-xs">{tx.member_id.slice(0, 8)}…</span> : "Not linked"} />}
              {!isExpense && (tx.payer_email || tx.payer_phone) && <Row k="Contact" v={[tx.payer_email, tx.payer_phone].filter(Boolean).join(" · ")} />}
              <Row k="Program" v={tx.programs?.name ? <Link href={`/transactions?program=${tx.program_id}`} className="hover:underline">{tx.programs.name}</Link> : "Unassigned"} />
              <Row k="Event" v={tx.events?.title ?? "—"} />
              <Row k="Budget line" v={tx.budget_id ? <Link href={`/budgets/${tx.budget_id}`} className="hover:underline">{tx.budget_lines?.name ?? "View budget"}</Link> : "—"} />
              <Row k="Reference" v={tx.reference ?? "—"} />
              {isExpense && <Row k="Approver" v={approverLabel(tx.approver_role)} />}
              <div className="sm:col-span-2"><dt className="label-caps text-muted">Description</dt><dd className="mt-1">{tx.description ?? <span className="text-muted">—</span>}</dd></div>
            </dl>
          </Card>

          {editable && (
            <Card>
              <Label tone="orange" className="mb-1">Edit</Label>
              <h2 className="text-xl mb-4">Update this entry</h2>
              <form action={updateTransactionAction} className="grid gap-4 md:grid-cols-2">
                <input type="hidden" name="id" value={tx.id} />
                <input type="hidden" name="kind" value={tx.kind} />
                {isExpense ? (
                  <Field label="Category">
                    <Input name="category" defaultValue={tx.category} list="edit-expense-categories" required />
                    <datalist id="edit-expense-categories">{expenseCats.map((c) => <option key={c} value={c} />)}</datalist>
                  </Field>
                ) : (
                  <Field label="Fund / category">
                    <Select name="category" defaultValue={tx.category} required>
                      <optgroup label="Giving funds">{funds.map((f) => <option key={f.id} value={f.slug}>{f.name}</option>)}</optgroup>
                      <optgroup label="Other income">
                        <option value="shop">Shop</option>
                        <option value="other">Other</option>
                        {!incomeCategoryKnown && <option value={tx.category}>{tx.category}</option>}
                      </optgroup>
                    </Select>
                  </Field>
                )}
                <Field label="Amount (GH₵)" hint={isExpense ? "Changing the amount may change who approves it." : undefined}>
                  <Input name="amount" type="number" inputMode="decimal" step="0.01" min="0.01" defaultValue={Number(tx.amount)} required />
                </Field>
                <Field label="Channel">
                  <Select name="channel" defaultValue={tx.channel} required>{CHANNELS.map((c) => <option key={c} value={c}>{CHANNEL_LABELS[c]}</option>)}</Select>
                </Field>
                <Field label="When"><Input name="occurred_at" type="datetime-local" defaultValue={toLocalInput(tx.occurred_at)} required /></Field>
                {isExpense ? (
                  <Field label="Payee" className="md:col-span-2"><Input name="payee_name" defaultValue={tx.payee_name ?? ""} /></Field>
                ) : (
                  <>
                    <div className="md:col-span-2"><MemberPicker search={searchMembersAction} defaultName={tx.payer_name ?? ""} defaultMemberId={tx.member_id ?? ""} defaultMemberLabel={tx.member_id ? tx.payer_name ?? "Linked member" : ""} /></div>
                    <Field label="Status">
                      <Select name="status" defaultValue={tx.status}><option value="paid">Paid</option><option value="counted">Counted</option></Select>
                    </Field>
                  </>
                )}
                <Field label="Program">
                  <Select name="program_id" defaultValue={tx.program_id ?? ""}><option value="">— None —</option>{programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
                </Field>
                <Field label="Event">
                  <Select name="event_id" defaultValue={tx.event_id ?? ""}>
                    <option value="">— None —</option>
                    {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
                    {tx.event_id && !events.some((e) => e.id === tx.event_id) && <option value={tx.event_id}>{tx.events?.title ?? "Current event"}</option>}
                  </Select>
                </Field>
                <Field label="Budget line" className="md:col-span-2">
                  <Select name="budget_line" defaultValue={tx.budget_line_id && tx.budget_id ? `${tx.budget_id}:${tx.budget_line_id}` : ""}>
                    <option value="">— None —</option>
                    {lineBudgets.map((b) => (
                      <optgroup key={b.id} label={`${b.title} · ${b.academic_year}${b.semester ? ` S${b.semester}` : ""}`}>
                        {b.budget_lines.filter((l) => l.kind === tx.kind).map((l) => <option key={l.id} value={`${b.id}:${l.id}`}>{l.name}</option>)}
                      </optgroup>
                    ))}
                    {tx.budget_line_id && tx.budget_id && !lineBudgets.some((b) => b.id === tx.budget_id) && <option value={`${tx.budget_id}:${tx.budget_line_id}`}>{tx.budget_lines?.name ?? "Current line"}</option>}
                  </Select>
                </Field>
                <Field label="Reference"><Input name="reference" defaultValue={tx.reference ?? ""} /></Field>
                <Field label="Description" className="md:col-span-2"><Textarea name="description" defaultValue={tx.description ?? ""} className="!min-h-[90px]" /></Field>
                <div className="md:col-span-2 flex items-center gap-3 pt-1">
                  <SubmitButton variant="blue" pendingText="Saving…">Save changes</SubmitButton>
                </div>
              </form>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6 min-w-0">
          <Card>
            <Label tone="orange" className="mb-1">Timeline</Label>
            <ol className="flex flex-col gap-4 mt-3">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className={`mt-1 w-3 h-3 rounded-full flex-none ${s.done ? (s.tone === "ember" ? "bg-ember" : "bg-royal") : "bg-ice border-2 border-royal/30"}`} aria-hidden />
                  <div className="min-w-0">
                    <div className={`font-bold text-sm ${s.done ? "" : "text-muted"}`}>{s.label}</div>
                    <div className="text-xs text-muted break-words">{s.detail}</div>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          {isExpense && (
            <Card>
              <Label tone="orange" className="mb-1">Actions</Label>
              {tx.status === "pending" && canDecide(roles, tx.approver_role) && (
                <div className="mt-3 flex flex-col gap-3">
                  <p className="text-sm">This expense of <strong>{money(tx.amount)}</strong> is yours to decide.</p>
                  <DecideForm id={tx.id} next={self} withNote size="md" />
                </div>
              )}
              {tx.status === "pending" && !canDecide(roles, tx.approver_role) && (
                <Notice tone="peach" className="mt-3">Awaiting {approverLabel(tx.approver_role)}.</Notice>
              )}
              {tx.status === "approved" && canDisburse(roles) && (
                <form action={markPaidAction} className="mt-3 flex flex-col gap-3">
                  <input type="hidden" name="id" value={tx.id} />
                  <input type="hidden" name="next" value={self} />
                  <Field label="Paid via">
                    <Select name="channel" defaultValue={tx.channel}>{CHANNELS.map((c) => <option key={c} value={c}>{CHANNEL_LABELS[c]}</option>)}</Select>
                  </Field>
                  <SubmitButton variant="blue" pendingText="Saving…">Mark as paid</SubmitButton>
                </form>
              )}
              {tx.status === "approved" && !canDisburse(roles) && <Notice tone="ice" className="mt-3">Approved. The finance team will disburse it.</Notice>}
              {tx.status === "rejected" && <Notice tone="peach" className="mt-3">Rejected{tx.decision_note ? `: ${tx.decision_note}` : "."}</Notice>}
              {tx.status === "paid" && <Notice tone="mint" className="mt-3">Paid out {fmtDateTime(tx.paid_at)}.</Notice>}
            </Card>
          )}

          {isAdmin(roles) && (
            <Card tone="ice">
              <Label className="mb-2">Admin</Label>
              <form action={deleteTransactionAction}>
                <input type="hidden" name="id" value={tx.id} />
                <ConfirmSubmit message="Delete this entry for good?" variant="danger" size="sm">Delete entry</ConfirmSubmit>
              </form>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <dt className="label-caps text-muted">{k}</dt>
      <dd className="mt-1 font-medium break-words">{v}</dd>
    </div>
  );
}
