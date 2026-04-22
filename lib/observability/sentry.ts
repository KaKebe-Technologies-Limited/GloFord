/**
 * Thin Sentry adapter. Only loaded when SENTRY_DSN is set (see
 * instrumentation.ts). Dynamic import keeps @sentry/nextjs out of the
 * dependency graph when unused.
 *
 * The `captureException` helper is safe to call from anywhere — if
 * Sentry never initialized, it falls back to the structured logger so
 * errors still surface somewhere.
 */
import { logger } from "./log";

type SentryShape = {
  init: (opts: Record<string, unknown>) => void;
  captureException: (e: unknown, hint?: Record<string, unknown>) => string;
  setUser: (u: Record<string, unknown> | null) => void;
  setTag: (k: string, v: string) => void;
};

let sentry: SentryShape | null = null;

/**
 * Initializes @sentry/nextjs with reasonable defaults. Called once at
 * boot. Subsequent calls are no-ops so it's safe to invoke defensively.
 */
export async function initSentry(): Promise<void> {
  if (sentry || !process.env.SENTRY_DSN) return;
  try {
    // Type-erased dynamic import so we don't pull @sentry/nextjs into
    // the build graph. If the package isn't installed, the await throws
    // and we fall through to the logger below.
    const specifier = "@sentry/nextjs";
    const mod = (await (Function("s", "return import(s)")(specifier) as Promise<unknown>)) as SentryShape;
    mod.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.SENTRY_ENV ?? process.env.NODE_ENV,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
      // Don't bundle the Next.js wizard's auto-config; keep this flat.
    });
    sentry = mod;
  } catch (err) {
    logger.warn("sentry: init failed, falling back to logger", {
      error: err instanceof Error ? err.message : String(err),
    });
    sentry = null;
  }
}

/**
 * Fire-and-forget error capture. Never throws.
 *
 * Pass `context` to attach a correlationId, tenantId, etc.:
 *   captureException(e, { correlationId, orgId, route: "POST /api/..." })
 */
export function captureException(e: unknown, context: Record<string, unknown> = {}): void {
  const message = e instanceof Error ? e.message : String(e);
  if (sentry) {
    try {
      sentry.captureException(e, { extra: context });
      return;
    } catch {
      /* fall through to logger */
    }
  }
  void logger.error("captureException", { message, ...context });
}
