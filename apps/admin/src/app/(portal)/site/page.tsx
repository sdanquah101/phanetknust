import { Card, Field, Input, Label, PageHeader, SubmitButton, Textarea } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import { fmtDateTime } from "@phanet/supabase/format";
import type { SiteSetting } from "@phanet/supabase/types";
import { Flash, type FlashParams } from "@/components/Flash";
import { SETTINGS } from "@/lib/settings";
import { saveSetting } from "./actions";

const asRecord = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const asText = (v: unknown) => (Array.isArray(v) ? v.map(String).join("\n") : v === null || v === undefined ? "" : String(v));

export default async function SitePage({ searchParams }: { searchParams: Promise<FlashParams> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("*");
  const settings = new Map(((data ?? []) as SiteSetting[]).map((s) => [s.key, s]));

  return (
    <>
      <PageHeader eyebrow="Site content" title="Words on the" script="website" />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        {SETTINGS.map((def) => {
          const row = settings.get(def.key);
          const value = asRecord(row?.value);
          return (
            <Card key={def.key} id={def.key} className="flex flex-col gap-4 scroll-mt-6">
              <div>
                <Label tone="orange">{def.key}</Label>
                <h2 className="text-xl mt-1">{def.title}</h2>
                <p className="text-sm text-muted mt-1">{def.blurb}</p>
              </div>
              <form action={saveSetting} className="flex flex-col gap-4">
                <input type="hidden" name="key" value={def.key} />
                {def.fields.map((f) => (
                  <Field key={f.name} label={f.label} hint={f.hint}>
                    {f.type === "textarea" || f.type === "lines" ? (
                      <Textarea name={f.name} defaultValue={asText(value[f.name])} placeholder={f.placeholder} rows={f.type === "lines" ? 5 : 3} className="!min-h-[90px]" />
                    ) : (
                      <Input name={f.name} type={f.type === "url" ? "url" : "text"} defaultValue={asText(value[f.name])} placeholder={f.placeholder} />
                    )}
                  </Field>
                ))}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-xs text-muted">{row ? `Updated ${fmtDateTime(row.updated_at)}` : "Not set yet"}</span>
                  <SubmitButton size="sm" pendingText="Saving…">Save</SubmitButton>
                </div>
              </form>
            </Card>
          );
        })}
      </div>
    </>
  );
}
