import { Card, Field, Label, Notice, PageHeader, SubmitButton, Textarea, Toast } from "@phanet/ui";
import { CSV_COLUMNS } from "@/lib/constants";
import { importMembersAction } from "./actions";

export const dynamic = "force-dynamic";

type SP = { ok?: string; error?: string; inserted?: string; skipped?: string; reasons?: string; note?: string };

export default async function DataPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const reported = sp.inserted !== undefined;
  const inserted = Number(sp.inserted ?? 0);
  const skipped = Number(sp.skipped ?? 0);
  const reasons = sp.reasons ? sp.reasons.split("\n").filter(Boolean) : [];

  return (
    <>
      <PageHeader eyebrow="Data" title="Import &" script="export" />
      <Toast message={sp.ok} tone="mint" />
      <Toast message={sp.error} tone="peach" />

      {reported && (
        <Card tone={skipped && !inserted ? "ice" : "blue"} className="flex flex-col gap-3">
          <Label tone={skipped && !inserted ? "orange" : "peach"}>Import report</Label>
          <div className="flex flex-wrap gap-8">
            <div><div className="num-xl">{inserted}</div><div className="text-xs opacity-80 mt-1">added</div></div>
            <div><div className="num-xl">{skipped}</div><div className="text-xs opacity-80 mt-1">skipped</div></div>
          </div>
          {sp.note && <p className="text-sm opacity-90">{sp.note}</p>}
          {reasons.length > 0 && (
            <ul className="text-xs opacity-90 list-disc pl-5 flex flex-col gap-0.5">
              {reasons.map((r, i) => <li key={i}>{r}</li>)}
              {skipped > reasons.length && <li>…and {skipped - reasons.length} more.</li>}
            </ul>
          )}
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card className="flex flex-col gap-4">
          <Label tone="orange">Export</Label>
          <p className="text-sm text-muted">Download every member with all columns as a CSV. Keep it safe — it holds personal data.</p>
          <a href="/api/members.csv" className="btn btn-blue self-start">Export CSV</a>
        </Card>

        <Card className="flex flex-col gap-4">
          <Label tone="orange">Import members</Label>
          <Notice tone="ice">
            First row must be a header. Recognised columns: <span className="font-mono text-[11px]">{CSV_COLUMNS.join(", ")}</span>. Friendly names like “Surname”, “Phone number” or “Level” are mapped automatically. Only <b>first_name</b> and <b>last_name</b> are required; dates can be YYYY-MM-DD or DD/MM/YYYY.
          </Notice>
          <form action={importMembersAction} className="flex flex-col gap-4">
            <Field label="CSV file"><input name="file" type="file" accept=".csv,text/csv,text/plain" className="input !py-2.5" /></Field>
            <Field label="…or paste CSV text">
              <Textarea name="csv" placeholder={"first_name,last_name,phone,hall,year_of_study\nAma,Owusu,0240000000,Africa Hall,200"} className="font-mono text-xs min-h-[160px]" />
            </Field>
            <div className="flex justify-end">
              <SubmitButton pendingText="Importing…">Import</SubmitButton>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
