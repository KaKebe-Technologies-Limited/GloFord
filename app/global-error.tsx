"use client";

import { useEffect } from "react";

/**
 * Catches errors thrown inside the ROOT layout (where the regular
 * app/error.tsx can't reach — that one runs inside the root layout
 * and so can't recover from the layout itself throwing).
 *
 * Ships with its own <html>/<body> because the root layout has
 * failed. Keep this file minimal and dependency-free so it renders
 * even when the ThemeProvider / i18n / etc. are the thing that broke.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[GlobalError:root]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#0b0b0c",
          color: "#f3f3f5",
          padding: "1rem",
        }}
      >
        <main style={{ maxWidth: 420, textAlign: "center" }}>
          <p
            style={{
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "#9a9aa3",
              margin: 0,
            }}
          >
            Error
          </p>
          <h1 style={{ margin: "0.5rem 0", fontSize: "1.5rem" }}>
            The application could not start.
          </h1>
          <p style={{ color: "#c4c4cc", fontSize: 14 }}>
            The team has been notified. You can try reloading — if the problem
            persists, head back to the home page.
          </p>
          {error.digest ? (
            <p style={{ color: "#9a9aa3", fontSize: 12, marginTop: "0.5rem" }}>
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            onClick={reset}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              fontSize: 14,
              fontWeight: 500,
              background: "#fff",
              color: "#0b0b0c",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
