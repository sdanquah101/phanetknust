"use client";
import * as React from "react";
import { Avatar, Field, Input } from "@phanet/ui";
import type { MemberSearchRow } from "@phanet/supabase/types";

/**
 * Payer name input + optional member search (rpc search_members via a server action).
 * Stores member_id in a hidden input; picking a member fills the name if empty.
 */
export function MemberPicker({
  search, defaultName = "", defaultMemberId = "", defaultMemberLabel = "",
}: {
  search: (q: string) => Promise<MemberSearchRow[]>;
  defaultName?: string; defaultMemberId?: string; defaultMemberLabel?: string;
}) {
  const [name, setName] = React.useState(defaultName);
  const [memberId, setMemberId] = React.useState(defaultMemberId);
  const [memberLabel, setMemberLabel] = React.useState(defaultMemberLabel);
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<MemberSearchRow[]>([]);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    const s = q.trim();
    if (s.length < 2) { setResults([]); return; }
    let alive = true;
    setBusy(true);
    const t = setTimeout(async () => {
      try {
        const rows = await search(s);
        if (alive) setResults(rows);
      } catch {
        if (alive) setResults([]);
      } finally {
        if (alive) setBusy(false);
      }
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [q, search]);

  function pick(m: MemberSearchRow) {
    setMemberId(m.id);
    setMemberLabel(`${m.full_name} · ${m.member_code}`);
    if (!name.trim()) setName(m.full_name);
    setQ("");
    setResults([]);
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Payer name" hint="Who gave? Leave blank for an anonymous offering.">
        <Input name="payer_name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ama Owusu" />
      </Field>
      <input type="hidden" name="member_id" value={memberId} />
      <div className="field">
        <span className="field-label">Link a member (optional)</span>
        {memberId ? (
          <div className="option-row" data-selected="true">
            <Avatar name={memberLabel} />
            <span className="truncate">{memberLabel || "Linked member"}</span>
            <button type="button" className="btn btn-ice btn-sm ml-auto" onClick={() => { setMemberId(""); setMemberLabel(""); }}>Unlink</button>
          </div>
        ) : (
          <>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, code or phone…" aria-label="Search members" />
            {busy && <span className="text-xs text-muted">Searching…</span>}
            {results.length > 0 && (
              <ul className="card p-2 flex flex-col gap-1 max-h-60 overflow-y-auto" role="listbox">
                {results.map((m) => (
                  <li key={m.id}>
                    <button type="button" className="option-row" onClick={() => pick(m)}>
                      <Avatar name={m.full_name} />
                      <span className="flex flex-col text-left min-w-0">
                        <span className="truncate">{m.full_name}</span>
                        <span className="text-xs text-muted font-medium truncate">{[m.member_code, m.hall, m.programme].filter(Boolean).join(" · ")}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {!busy && q.trim().length >= 2 && results.length === 0 && <span className="text-xs text-muted">No member matches “{q.trim()}”.</span>}
          </>
        )}
      </div>
    </div>
  );
}
