import type { NextRequest } from "next/server";
import { createClient, getSession } from "@phanet/supabase/server";
import { canAccess, PORTAL_ROLES } from "@phanet/supabase/roles";
import { CHANNEL_LABELS, type Transaction } from "@phanet/supabase/types";
import { dayEnd, dayStart } from "@/lib/queries";

export const dynamic = "force-dynamic";

const HEADER = ["date", "kind", "category", "channel", "amount", "status", "payer/payee", "program", "reference", "description"];
const CHUNK = 1000;

function cell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function line(cells: unknown[]) {
  return cells.map(cell).join(",") + "\r\n";
}

type Row = Transaction & { programs?: { name: string } | null };

/** GET /api/export?from=&to=&kind=&category=&channel=&program=&status=&q= → streams CSV. */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return new Response("Sign in first.", { status: 401 });
  if (!canAccess(session.roles, PORTAL_ROLES.finance)) return new Response("Not allowed.", { status: 403 });

  const sp = request.nextUrl.searchParams;
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";
  const kind = sp.get("kind") ?? "";
  const category = sp.get("category") ?? "";
  const channel = sp.get("channel") ?? "";
  const program = sp.get("program") ?? "";
  const status = sp.get("status") ?? "";
  const q = (sp.get("q") ?? "").replace(/[%,()]/g, " ").trim();
  const supabase = await createClient();

  const build = (offset: number) => {
    let query = supabase.from("transactions").select("*, programs(name)").order("occurred_at", { ascending: true }).range(offset, offset + CHUNK - 1);
    if (kind === "income" || kind === "expense") query = query.eq("kind", kind);
    if (category) query = query.eq("category", category);
    if (channel) query = query.eq("channel", channel);
    if (program === "none") query = query.is("program_id", null);
    else if (program) query = query.eq("program_id", program);
    if (status) query = query.eq("status", status);
    if (from) query = query.gte("occurred_at", dayStart(from));
    if (to) query = query.lte("occurred_at", dayEnd(to));
    if (q) query = query.or(`payer_name.ilike.%${q}%,payee_name.ilike.%${q}%,description.ilike.%${q}%,reference.ilike.%${q}%,category.ilike.%${q}%`);
    return query;
  };

  const encoder = new TextEncoder();
  let offset = 0;
  let done = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode("﻿" + line(HEADER)));
    },
    async pull(controller) {
      if (done) { controller.close(); return; }
      const { data, error } = await build(offset);
      if (error) { controller.enqueue(encoder.encode(line(["error", error.message]))); controller.close(); return; }
      const rows = (data ?? []) as Row[];
      let out = "";
      for (const t of rows) {
        out += line([
          new Date(t.occurred_at).toISOString().slice(0, 10), t.kind, t.category, CHANNEL_LABELS[t.channel] ?? t.channel, Number(t.amount).toFixed(2), t.status,
          t.kind === "income" ? t.payer_name : t.payee_name, t.programs?.name ?? "", t.reference, t.description,
        ]);
      }
      if (out) controller.enqueue(encoder.encode(out));
      offset += rows.length;
      if (rows.length < CHUNK) { done = true; controller.close(); }
    },
  });

  const name = `phanet-ledger${kind ? `-${kind}` : ""}${from ? `-${from}` : ""}${to ? `-to-${to}` : ""}.csv`;
  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
