/**
 * Next.js loads this file once per runtime and calls `register()` before
 * any request is served. We use it for tenant-agnostic boot hooks:
 *
 *   1. A structured logger with correlation-ID support that downstream
 *      code imports from `@/lib/observability/log`.
 *   2. Sentry error capture — gated on SENTRY_DSN so unset = no-op.
 *   3. A hook point for OpenTelemetry — guarded so the app still boots
 *      when OTEL packages aren't installed.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // ─── Structured stdout logger ──────────────────────────────
  const { subscribeProcessErrors } = await import("@/lib/observability/log");
  subscribeProcessErrors();

  // ─── Sentry (optional) ─────────────────────────────────────
  // Loaded dynamically so the dependency is only required when
  // SENTRY_DSN is set. If the package isn't installed, swallow the
  // import error and keep booting — logger still catches everything.
  if (process.env.SENTRY_DSN) {
    try {
      const { initSentry } = await import("@/lib/observability/sentry");
      initSentry();
    } catch (err) {
      console.warn(
        "[instrumentation] SENTRY_DSN set but @sentry/nextjs could not be loaded:",
        err instanceof Error ? err.message : err,
      );
    }
  }

  // ─── OpenTelemetry (optional) ──────────────────────────────
  // if (process.env.OTEL_ENABLED === "1") {
  //   const { registerOTel } = await import("@vercel/otel");
  //   registerOTel({ serviceName: "gloford" });
  // }
}
