"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[AppError]", error);
    // Best-effort: if Sentry is configured it'll already have been
    // captured by the server runtime; this fires a client-side event
    // too so client-only crashes aren't lost.
    void fetch("/api/client-error", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        digest: error.digest,
        stack: error.stack,
      }),
    }).catch(() => {
      /* swallow — never let error reporting error */
    });
  }, [error]);

  return (
    <main className="grid min-h-[60dvh] place-items-center px-4">
      <div className="max-w-md space-y-3 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-fg)]">Error</p>
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-[var(--color-muted-fg)]">
          The team has been notified. You can try again, or head back to the home page.
        </p>
        {error.digest ? (
          <p className="text-xs text-[var(--color-muted-fg)]">Reference: {error.digest}</p>
        ) : null}
        <button
          onClick={reset}
          className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-fg)]"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
