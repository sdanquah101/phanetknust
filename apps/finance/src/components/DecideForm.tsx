import { Input, SubmitButton } from "@phanet/ui";
import { decideExpenseAction } from "@/app/(portal)/transactions/actions";

/** Approve / Reject pair posting to decide_expense. `next` is where to land afterwards. */
export function DecideForm({ id, next, withNote = false, size = "sm" }: { id: string; next: string; withNote?: boolean; size?: "sm" | "md" }) {
  return (
    <form action={decideExpenseAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="next" value={next} />
      {withNote && <Input name="note" placeholder="Note (optional)" className="!w-auto flex-1 min-w-[160px] !py-2.5" aria-label="Decision note" />}
      <SubmitButton name="decision" value="approved" variant="blue" size={size} pendingText="Saving…">Approve</SubmitButton>
      <SubmitButton name="decision" value="rejected" variant="ice" size={size} pendingText="Saving…" className="!text-ember">Reject</SubmitButton>
    </form>
  );
}
