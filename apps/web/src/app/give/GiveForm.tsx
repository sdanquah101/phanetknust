"use client";
import { useActionState, useState } from "react";
import { Button, Field, Input, Notice } from "@phanet/ui";
import { money } from "@phanet/supabase/format";
import type { GivingFund } from "@phanet/supabase/types";
import { giveAction } from "./actions";

const PRESETS = [20, 50, 100, 200];

export function GiveForm({ funds, initialFund }: { funds: GivingFund[]; initialFund?: string }) {
  const [fund, setFund] = useState(initialFund ?? funds[0]?.slug ?? "offering");
  const [amount, setAmount] = useState<number | "">(50);
  const [custom, setCustom] = useState(false);
  const [method, setMethod] = useState<"mobile_money" | "card">("mobile_money");
  const [anonymous, setAnonymous] = useState(false);
  const [state, action, pending] = useActionState(giveAction, undefined);
  const active = funds.find((f) => f.slug === fund);

  return (
    <form action={action} className="card card-lg p-7 md:p-8 flex flex-col gap-6">
      <input type="hidden" name="fund" value={fund} />
      <input type="hidden" name="method" value={method} />
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="label-caps-orange">Give to</div>
          <div className="text-2xl font-extrabold text-deep">{active?.name ?? "Offering"}</div>
        </div>
        {active?.target_amount ? <span className="badge badge-warn">Goal {money(active.target_amount, { compact: true })}</span> : null}
      </div>
      {funds.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {funds.map((f) => <button key={f.id} type="button" className="chip" data-selected={fund === f.slug} onClick={() => setFund(f.slug)}>{f.name}</button>)}
        </div>
      )}
      {state?.error && <Notice tone="peach">{state.error}</Notice>}

      <div>
        <div className="field-label mb-2">Amount</div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => <button key={p} type="button" className="chip" data-selected={!custom && amount === p} onClick={() => { setCustom(false); setAmount(p); }}>GH₵ {p}</button>)}
          <button type="button" className="chip" data-selected={custom} onClick={() => { setCustom(true); setAmount(""); }}>Other</button>
        </div>
        {custom ? (
          <Input name="amount" type="number" min={1} step="0.01" inputMode="decimal" placeholder="GH₵ amount" className="mt-3" value={amount} onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))} required />
        ) : (
          <input type="hidden" name="amount" value={amount} />
        )}
      </div>

      <div>
        <div className="field-label mb-2">Pay with</div>
        <div className="flex flex-col gap-2">
          <button type="button" className="option-row" data-selected={method === "mobile_money"} onClick={() => setMethod("mobile_money")}>
            <span className="w-8 h-8 rounded-[10px] bg-[#FFCC00]" aria-hidden /> <span>MTN MoMo · Telecel Cash<br /><span className="text-xs text-muted font-medium">Approve the prompt on your phone</span></span><span className="radio" />
          </button>
          <button type="button" className="option-row" data-selected={method === "card"} onClick={() => setMethod("card")}>
            <span className="w-8 h-8 rounded-[10px] bg-royal" aria-hidden /> <span>Card · Visa / Mastercard</span><span className="radio" />
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {!anonymous && <Field label="Name"><Input name="name" autoComplete="name" placeholder="Ama Owusu" /></Field>}
        <Field label="Email" hint="Your receipt goes here." className={anonymous ? "sm:col-span-2" : ""}><Input name="email" type="email" autoComplete="email" placeholder="you@st.knust.edu.gh" required /></Field>
        {!anonymous && <Field label="Phone"><Input name="phone" type="tel" autoComplete="tel" placeholder="024 000 0000" /></Field>}
        <Field label="Note (optional)" className={anonymous ? "sm:col-span-2" : ""}><Input name="note" placeholder="Seed for exams, thanksgiving…" /></Field>
      </div>
      <label className="flex items-center gap-3 text-sm font-semibold text-deep">
        <input type="checkbox" name="anonymous" className="check" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} /> Give anonymously
      </label>

      <Button type="submit" size="lg" disabled={pending || amount === "" || Number(amount) < 1}>
        {pending ? "Starting payment…" : `Give ${amount === "" ? "" : money(Number(amount))} →`}
      </Button>
      <p className="text-xs text-muted text-center">Secured by Paystack. Every cedi is receipted instantly and visible to the Financial Secretary.</p>
    </form>
  );
}
