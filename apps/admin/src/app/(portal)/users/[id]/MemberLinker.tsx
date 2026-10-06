"use client";
import * as React from "react";
import { Input, SubmitButton } from "@phanet/ui";
import type { MemberSearchRow } from "@phanet/supabase/types";
import { linkMember, searchMembersAction } from "../actions";

export function MemberLinker({ userId }: { userId: string }) {
  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState<MemberSearchRow[]>([]);
  const [searching, setSearching] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  function onChange(v: string) {
    setQ(v);
    if (timer.current) clearTimeout(timer.current);
    if (v.trim().length < 2) { setRows([]); return; }
    timer.current = setTimeout(async () => {
      setSearching(true);
      try { setRows(await searchMembersAction(v)); } finally { setSearching(false); }
    }, 250);
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="field">
        <span className="field-label">Find a member</span>
        <Input value={q} onChange={(e) => onChange(e.target.value)} placeholder="Name, member code or phone" autoComplete="off" />
      </label>
      {searching && <div className="text-xs text-muted">Searching…</div>}
      {!searching && q.trim().length >= 2 && rows.length === 0 && <div className="text-xs text-muted">No members match. Add them in the Database portal first.</div>}
      <ul className="flex flex-col gap-2">
        {rows.map((m) => (
          <li key={m.id} className="option-row flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-bold truncate">{m.full_name}</div>
              <div className="text-xs text-muted truncate">{m.member_code}{m.hall ? ` · ${m.hall}` : ""}{m.programme ? ` · ${m.programme}` : ""}</div>
            </div>
            <form action={linkMember}>
              <input type="hidden" name="user_id" value={userId} />
              <input type="hidden" name="member_id" value={m.id} />
              <SubmitButton variant="blue" size="sm" pendingText="Linking…">Link</SubmitButton>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
