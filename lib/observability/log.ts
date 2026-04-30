import { headers } from "next/headers";

/**
 * Minimal structured logger. Writes one-line JSON to stdout in production
 * so Vercel / Fly / Docker log drivers pick it up directly. Dev mode
 * pretty-prints.
 *
 * Every log line carries a correlationId if one is in flight, so you
 * can grep a multi-request trace together.
 */

type Level = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const envLevel = (process.env.LOG_LEVEL as Level) ?? "info";
const threshold = LEVEL_ORDER[envLevel] ?? LEVEL_ORDER.info;

async function correlationId(): Promise<string | undefined> {
  try {
    const h = await headers();
    return h.get("x-correlation-id") ?? undefined;
  } catch {
    return undefined;
  }
}

export async function log(
  level: Level,
  message: string,
  fields: Record<string, unknown> = {},
) {
  try {
    if (LEVEL_ORDER[level] < threshold) return;
    const cid = await correlationId().catch(() => undefined);
    // Sanitize message and string fields to prevent log injection
    const safeMsg = String(message).replace(/[\r\n\t]/g, " ").slice(0, 2000);
    const safeFields = sanitizeFields(fields);
    const entry = {
      t: new Date().toISOString(),
      level,
      msg: safeMsg,
      cid,
      ...safeFields,
    };
    if (process.env.NODE_ENV === "production") {
      try {
        process.stdout.write(`${safeStringify(entry)}\n`);
      } catch {
        // stdout closed or JSON encoding threw; fall back to console.
        // eslint-disable-next-line no-console
        console.log(`[${level}] ${message}`);
      }
    } else {
      // eslint-disable-next-line no-console
      console.log(`[${level}] ${message}`, fields, cid ? `(cid=${cid})` : "");
    }
  } catch {
    /* swallow — logging must never throw */
  }
}

/**
 * Sanitize log fields — strip newlines from string values to prevent
 * log injection (CWE-117).
 */
function sanitizeFields(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (typeof v === "string") {
      out[k] = v.replace(/[\r\n\t]/g, " ").slice(0, 1000);
    } else {
      out[k] = v;
    }
  }
  return out;
}

/**
 * JSON.stringify safe against circular refs + BigInt. Falls back to a
 * best-effort "[unserializable]" marker so the line still writes.
 */
function safeStringify(obj: unknown): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(obj, (_k, v) => {
    if (typeof v === "bigint") return v.toString();
    if (v && typeof v === "object") {
      if (seen.has(v as object)) return "[circular]";
      seen.add(v as object);
    }
    return v;
  });
}

export const logger = {
  debug: (msg: string, fields?: Record<string, unknown>) => log("debug", msg, fields),
  info: (msg: string, fields?: Record<string, unknown>) => log("info", msg, fields),
  warn: (msg: string, fields?: Record<string, unknown>) => log("warn", msg, fields),
  error: (msg: string, fields?: Record<string, unknown>) => log("error", msg, fields),
};

/**
 * Register process-level handlers so uncaught errors land in the same
 * log format. Called once from instrumentation.ts.
 */
export function subscribeProcessErrors() {
  process.on("uncaughtException", (err) => {
    process.stdout.write(
      `${JSON.stringify({
        t: new Date().toISOString(),
        level: "error",
        msg: "uncaughtException",
        error: err.message,
        stack: err.stack,
      })}\n`,
    );
  });
  process.on("unhandledRejection", (reason) => {
    process.stdout.write(
      `${JSON.stringify({
        t: new Date().toISOString(),
        level: "error",
        msg: "unhandledRejection",
        reason:
          reason instanceof Error
            ? { message: reason.message, stack: reason.stack }
            : String(reason),
      })}\n`,
    );
  });
}
