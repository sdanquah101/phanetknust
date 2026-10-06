"use client";
import * as React from "react";
import { Button } from "@phanet/ui";

export function CopyButton({ text, label = "Copy code", className }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = React.useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      window.setTimeout(() => setDone(false), 2000);
    } catch {
      window.prompt("Copy your code", text);
    }
  }
  return (
    <Button variant="white" onClick={copy} className={className} aria-live="polite">
      {done ? "Copied!" : label}
    </Button>
  );
}
