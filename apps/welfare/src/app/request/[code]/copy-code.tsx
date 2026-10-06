"use client";
import * as React from "react";
import { Button } from "@phanet/ui";

export function CopyCode({ code }: { code: string }) {
  const [done, setDone] = React.useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }
  return <Button variant="ice" size="sm" onClick={copy}>{done ? "Copied!" : "Copy code"}</Button>;
}
