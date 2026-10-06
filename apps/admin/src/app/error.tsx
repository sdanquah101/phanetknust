"use client";
import { RouteError } from "@phanet/ui";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError error={error} reset={reset} brand="PHANET ADMIN" />;
}
