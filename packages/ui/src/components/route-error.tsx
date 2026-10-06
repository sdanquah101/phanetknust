"use client";
import * as React from "react";
import { Blobs, Logo } from "./primitives";

/** True when the page in the browser is from an older deploy than the server (e.g. a tab left open across a redeploy). */
function isStaleDeploy(error: Error) {
  const m = `${error?.name ?? ""} ${error?.message ?? ""}`;
  return /Server Action .* was not found|UnrecognizedActionError|Failed to find Server Action|ChunkLoadError|Loading chunk .* failed/i.test(m);
}

/**
 * Route error screen for app/error.tsx. After a redeploy, an open tab can call code that no longer
 * exists on the server; we reload once to pick up the new version instead of showing an error.
 */
export function RouteError({ error, reset, brand = "PHANET KNUST" }: { error: Error & { digest?: string }; reset: () => void; brand?: string }) {
  const stale = isStaleDeploy(error);
  React.useEffect(() => {
    if (!stale) return;
    try {
      const key = "phanet-reloaded-for-new-version";
      if (sessionStorage.getItem(key) !== location.pathname) {
        sessionStorage.setItem(key, location.pathname);
        location.reload();
      }
    } catch {
      location.reload();
    }
  }, [stale]);

  return (
    <div className="ground-blue min-h-dvh flex flex-col">
      <Blobs />
      <div className="container-page pt-6"><Logo text={brand} href="/" /></div>
      <div className="container-page flex-1 grid place-items-center py-10">
        <div className="card card-lg p-8 md:p-10 max-w-md text-center flex flex-col items-center gap-4">
          <h1 className="t-h3 text-deep">{stale ? "Getting the latest version…" : "Something went wrong"}</h1>
          <p className="t-small text-muted">
            {stale ? "This page was updated while it was open. Reloading now." : "Please try again. If it keeps happening, reload the page."}
          </p>
          <div className="flex gap-2">
            <button type="button" className="btn btn-blue" onClick={() => (stale ? location.reload() : reset())}>Try again</button>
            <button type="button" className="btn btn-ice" onClick={() => location.reload()}>Reload page</button>
          </div>
          {error?.digest && <p className="text-xs text-muted">Reference: {error.digest}</p>}
        </div>
      </div>
    </div>
  );
}
