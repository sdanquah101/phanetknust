"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button, Input, Notice } from "@phanet/ui";
import type { MemberSearchRow } from "@phanet/supabase/types";
import { searchMembers } from "@/app/(attendance)/attendance/actions";
import { assignSheep } from "@/app/(portal)/leaders/actions";

export function SheepAssigner({ leaderId, leaderNames }: { leaderId: string; leaderNames: Record<string, string> }) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<MemberSearchRow[]>([]);
  const [chosen, setChosen] = React.useState<Map<string, string>>(new Map());
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<{ tone: "mint" | "peach"; text: string } | null>(null);

  React.useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      const rows = await searchMembers(term);
      if (!cancelled) setResults(rows.filter((r) => r.leader_id !== leaderId));
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q, leaderId]);

  function toggle(m: MemberSearchRow) {
    setChosen((prev) => {
      const next = new Map(prev);
      if (next.has(m.id)) next.delete(m.id); else next.set(m.id, m.full_name);
      return next;
    });
  }

  async function submit() {
    if (!chosen.size) return;
    setBusy(true);
    try {
      const r = await assignSheep(leaderId, [...chosen.keys()]);
      if (r.ok) {
        setMsg({ tone: "mint", text: `${r.count} member${r.count === 1 ? "" : "s"} assigned.` });
        setChosen(new Map()); setQ(""); setResults([]);
        router.refresh();
      } else setMsg({ tone: "peach", text: r.error });
    } finally { setBusy(false); }
  }

  return (
    <div className="card p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="label-caps-orange">Assign sheep</div>
        {chosen.size > 0 && <span className="pill pill-ice">{chosen.size} selected</span>}
      </div>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, code or phone…" aria-label="Search members to assign" />
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      {chosen.size > 0 && (
        <div className="flex flex-wrap gap-2">
          {[...chosen.entries()].map(([id, name]) => (
            <button key={id} type="button" className="chip" data-selected onClick={() => setChosen((p) => { const n = new Map(p); n.delete(id); return n; })}>
              {name} ×
            </button>
          ))}
        </div>
      )}
      <ul className="flex flex-col gap-2 max-h-80 overflow-y-auto">
        {q.trim().length >= 2 && !results.length && <li className="text-sm text-muted">No other members match.</li>}
        {results.map((m) => {
          const on = chosen.has(m.id);
          return (
            <li key={m.id}>
              <label className="option-row cursor-pointer" data-selected={on}>
                <input type="checkbox" className="check" checked={on} onChange={() => toggle(m)} />
                <Avatar name={m.full_name} />
                <div className="min-w-0 flex-1">
                  <div className="truncate">{m.full_name}</div>
                  <div className="text-xs text-muted font-medium">
                    {m.member_code}{m.hall ? ` · ${m.hall}` : ""} · {m.leader_id ? `with ${leaderNames[m.leader_id] ?? "another leader"}` : "unassigned"}
                  </div>
                </div>
              </label>
            </li>
          );
        })}
      </ul>
      <div className="flex justify-end">
        <Button onClick={submit} disabled={busy || chosen.size === 0}>{busy ? "Assigning…" : `Assign ${chosen.size || ""}`.trim()}</Button>
      </div>
    </div>
  );
}
