"use client";
import * as React from "react";
import { cn } from "@phanet/ui";
import { prayAction } from "@/app/actions";

const KEY = "pw-prayed";

function readPrayed(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function remember(id: string) {
  try {
    const ids = readPrayed();
    if (!ids.includes(id)) window.localStorage.setItem(KEY, JSON.stringify([...ids, id]));
  } catch {
    /* private mode or blocked storage: the button still disables for this view */
  }
}

export function PrayButton({ id, count: initial, className }: { id: string; count: number; className?: string }) {
  const [count, setCount] = React.useState(initial);
  const [prayed, setPrayed] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (readPrayed().includes(id)) setPrayed(true);
  }, [id]);

  function onClick() {
    if (prayed || pending) return;
    setPrayed(true);
    setCount((c) => c + 1);
    remember(id);
    startTransition(async () => {
      try {
        const n = await prayAction(id);
        if (n > 0) setCount(n);
      } catch {
        /* keep the optimistic count */
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={prayed}
      aria-pressed={prayed}
      className={cn("btn btn-sm", prayed ? "btn-ice !opacity-100" : "btn-blue", className)}
      title={prayed ? "You're praying for this" : "Pray for this request"}
    >
      <span aria-hidden>🙏</span>
      <span>{prayed ? "Praying" : "I'm praying"}</span>
      <span className="opacity-70">· {count}</span>
    </button>
  );
}
