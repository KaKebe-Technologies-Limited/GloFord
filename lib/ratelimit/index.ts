import { db } from "@/lib/db";

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: Date;
};

/**
 * Postgres-backed fixed-window rate limiter.
 *
 * Window boundaries are deterministic (now rounded down to the nearest
 * `windowSeconds`), so parallel callers converge on the same row and
 * the upsert is safe under contention. Not strict token-bucket; good
 * enough for "stop obvious abuse" which is the goal here.
 *
 * Resilience: if the underlying DB is unavailable we **fail open** —
 * better to let a legitimate donor through than to 500 the whole
 * public form. The event is logged so operators still see the
 * degradation. Flip `failOpen: false` on a bucket if you'd rather
 * fail closed (e.g. admin login brute-force protection).
 */
export async function rateLimit(opts: {
  bucket: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
  failOpen?: boolean;
}): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = opts.windowSeconds * 1000;
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const windowEnd = new Date(windowStart + windowMs);
  const failOpen = opts.failOpen ?? true;

  try {
    const hit = await db.rateLimitHit.upsert({
      where: {
        bucket_identifier_windowEnd: {
          bucket: opts.bucket,
          identifier: opts.identifier,
          windowEnd,
        },
      },
      create: {
        bucket: opts.bucket,
        identifier: opts.identifier,
        windowEnd,
        count: 1,
      },
      update: { count: { increment: 1 } },
      select: { count: true },
    });

    const ok = hit.count <= opts.limit;
    return {
      ok,
      remaining: Math.max(0, opts.limit - hit.count),
      resetAt: windowEnd,
    };
  } catch (err) {
    // Lazy-load the logger so this module can still be used in edge
    // runtimes where headers() isn't available.
    void import("@/lib/observability/log")
      .then(({ logger }) =>
        logger.error("ratelimit.backend.failed", {
          bucket: opts.bucket,
          identifier: opts.identifier,
          failOpen,
          error: err instanceof Error ? err.message : String(err),
        }),
      )
      .catch(() => {});
    return {
      ok: failOpen,
      remaining: failOpen ? opts.limit : 0,
      resetAt: windowEnd,
    };
  }
}

/**
 * Helper for returning a 429 when rateLimit fails. Adds the standard
 * headers clients and proxies know to respect.
 */
export function tooManyRequests(result: RateLimitResult, message?: string) {
  return new Response(
    JSON.stringify({ error: message ?? "Too many requests" }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(
          Math.max(1, Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)),
        ),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.floor(result.resetAt.getTime() / 1000)),
      },
    },
  );
}

export function clientIdentifier(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? "unknown";
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
