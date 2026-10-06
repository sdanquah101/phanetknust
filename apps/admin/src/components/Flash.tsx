import { Toast } from "@phanet/ui";

/** Renders the ?ok= / ?error= toast. Pass the awaited searchParams. */
export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <>
      {ok && <Toast message={ok} tone="mint" />}
      {error && <Toast message={error} tone="peach" />}
    </>
  );
}
export type FlashParams = { ok?: string; error?: string };
