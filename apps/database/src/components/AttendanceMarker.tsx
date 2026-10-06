"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Avatar, Badge, Button, Input, Notice } from "@phanet/ui";
import type { MemberSearchRow } from "@phanet/supabase/types";
import { fmtTime } from "@phanet/supabase/format";
import type { MarkedRow } from "@/lib/queries";
import { markAttendance, markByCode, searchMembers, unmarkAttendance, type MarkResult } from "@/app/(attendance)/attendance/actions";

type Props = { eventId: string; marked: MarkedRow[]; markedIds: string[]; userId: string; canUnmarkAll: boolean };

export function AttendanceMarker({ eventId, marked, markedIds, userId, canUnmarkAll }: Props) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<MemberSearchRow[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<{ tone: "mint" | "peach" | "ice"; text: string } | null>(null);
  const [code, setCode] = React.useState("");
  const markedSet = React.useMemo(() => new Set(markedIds), [markedIds]);
  const codeRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults([]); return; }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const rows = await searchMembers(term);
        if (!cancelled) setResults(rows);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q]);

  function show(r: MarkResult, name?: string) {
    if (!r.ok) setMsg({ tone: "peach", text: r.error });
    else if (r.already) setMsg({ tone: "ice", text: `${r.name ?? name ?? "Member"} was already marked present.` });
    else setMsg({ tone: "mint", text: `${r.name ?? name ?? "Member"} marked present.` });
  }

  async function mark(m: MemberSearchRow) {
    setBusy(m.id);
    try {
      const r = await markAttendance(eventId, m.id);
      show(r, m.full_name);
      if (r.ok) router.refresh();
    } finally { setBusy(null); }
  }

  async function byCode(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim();
    if (!c) return;
    setBusy("code");
    try {
      const r = await markByCode(eventId, c);
      show(r);
      if (r.ok) { setCode(""); router.refresh(); }
    } finally { setBusy(null); codeRef.current?.focus(); }
  }

  async function unmark(id: string, name: string) {
    if (!window.confirm(`Remove ${name} from this event's attendance?`)) return;
    setBusy(id);
    try {
      const r = await unmarkAttendance(id, eventId);
      if (r.ok) { setMsg({ tone: "ice", text: `${name} removed.` }); router.refresh(); }
      else setMsg({ tone: "peach", text: r.error });
    } finally { setBusy(null); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="flex flex-col gap-4">
        <div className="card p-6 flex flex-col gap-4">
          <div className="label-caps-orange">Find a member</div>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, code or phone…" autoFocus aria-label="Search members" />
          {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
          <ul className="flex flex-col gap-2">
            {searching && !results.length && <li className="text-sm text-muted">Searching…</li>}
            {!searching && q.trim().length >= 2 && !results.length && <li className="text-sm text-muted">No one matches “{q.trim()}”.</li>}
            {results.map((m) => {
              const done = markedSet.has(m.id);
              return (
                <li key={m.id} className="option-row" data-selected={done}>
                  <Avatar name={m.full_name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{m.full_name}</div>
                    <div className="text-xs text-muted font-medium">{m.member_code}{m.hall ? ` · ${m.hall}` : ""}{m.year_of_study ? ` · ${m.year_of_study}` : ""}</div>
                  </div>
                  {done ? <Badge tone="mint">Present</Badge> : (
                    <Button size="sm" variant="blue" disabled={busy === m.id} onClick={() => mark(m)}>{busy === m.id ? "…" : "Present"}</Button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <form onSubmit={byCode} className="card-ice p-5 flex flex-col gap-3">
          <div className="label-caps-orange">Mark by code</div>
          <div className="flex gap-2">
            <Input ref={codeRef} value={code} onChange={(e) => setCode(e.target.value)} placeholder="PHA-2026-0001" aria-label="Member code" autoComplete="off" />
            <Button type="submit" size="md" disabled={busy === "code"}>Mark</Button>
          </div>
          <p className="text-xs text-muted">Scan or type a member code and press Enter.</p>
        </form>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="label-caps-orange">Marked present</div>
          <span className="num-lg">{marked.length}</span>
        </div>
        {marked.length === 0 ? (
          <p className="text-sm text-muted">No one yet. Search on the left to start marking.</p>
        ) : (
          <ul className="divide-y divide-ice">
            {marked.map((r) => {
              const name = r.members ? [r.members.first_name, r.members.other_names, r.members.last_name].filter(Boolean).join(" ") : "Member";
              const mine = r.marked_by === userId;
              return (
                <li key={r.id} className="flex items-center gap-3 py-3">
                  <Avatar name={name} peach />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold truncate">{name}</div>
                    <div className="text-xs text-muted">{r.members?.member_code ?? "—"} · {fmtTime(r.marked_at)}{r.marker_name ? ` · by ${r.marker_name}` : ""}</div>
                  </div>
                  {(canUnmarkAll || mine) && (
                    <button type="button" className="btn btn-ice btn-sm" disabled={busy === r.id} onClick={() => unmark(r.id, name)}>Unmark</button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
