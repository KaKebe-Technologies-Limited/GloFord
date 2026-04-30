import type { Prisma } from "@prisma/client";
import type { z, ZodTypeAny } from "zod";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { ValidationError } from "@/lib/errors";
import { authorize } from "@/lib/rbac/authorize";
import type { Actor } from "@/lib/tenant/context";
import { inngest } from "@/lib/inngest/client";
import { captureException } from "@/lib/observability/sentry";

const CORRELATION_HEADER = "x-correlation-id";

async function readCorrelationId(): Promise<string | undefined> {
  try {
    const h = await headers();
    return h.get(CORRELATION_HEADER) ?? undefined;
  } catch {
    return undefined;
  }
}

async function readRequestContext() {
  try {
    const h = await headers();
    // Sanitize IP — only keep characters valid in IPv4/IPv6 addresses (CWE-117)
    const rawIp =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      undefined;
    const ip = rawIp?.replace(/[^0-9a-fA-F.:]/g, "").slice(0, 45) ?? undefined;
    const userAgent = h.get("user-agent")?.replace(/[\r\n]/g, " ").slice(0, 500) ?? undefined;
    return ip || userAgent ? { ip, userAgent } : undefined;
  } catch {
    return undefined;
  }
}

type ResourceRef = {
  type: string;
  id?: string;
  ownerId?: string;
};

export type ServiceContext<TInput> = {
  actor: Actor;
  input: TInput;
  tx: Prisma.TransactionClient;
};

type VersionRef = { entityType: string; entityId: string };

export type ServiceConfig<S extends ZodTypeAny, TOut> = {
  module: string;
  action: string;
  schema: S;
  permission: (input: z.infer<S>, actor: Actor) => ResourceRef;
  exec: (ctx: ServiceContext<z.infer<S>>) => Promise<TOut>;
  version?: (out: TOut, input: z.infer<S>) => VersionRef | null;
  loadBefore?: (ctx: {
    actor: Actor;
    input: z.infer<S>;
    tx: Prisma.TransactionClient;
  }) => Promise<unknown>;
};

/**
 * Compose a service from:
 *   parse → authorize → transact → audit/version events → return.
 *
 * Audit + versioning are fire-and-forget through Inngest; failures
 * there don't affect the caller. See the resilience guide in BACKUP.md.
 */
export function createService<S extends ZodTypeAny, TOut>(cfg: ServiceConfig<S, TOut>) {
  return async (actor: Actor, raw: unknown): Promise<TOut> => {
    const parsed = cfg.schema.safeParse(raw);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new ValidationError(issue?.message ?? "Invalid input");
    }
    const input = parsed.data as z.infer<S>;

    const ref = cfg.permission(input, actor);
    await authorize(actor, `${cfg.module}.${cfg.action}`, ref);

    let before: unknown = undefined;
    let out: TOut;
    try {
      out = await db.$transaction(async (tx) => {
        if (cfg.loadBefore) before = await cfg.loadBefore({ actor, input, tx });
        return cfg.exec({ actor, input, tx });
      });
    } catch (err) {
      captureException(err, {
        action: `${cfg.module}.${cfg.action}`,
        userId: actor.userId,
      });
      throw err;
    }

    const [correlationId, request] = await Promise.all([
      readCorrelationId(),
      readRequestContext(),
    ]);
    const versionRef = cfg.version?.(out, input) ?? null;
    const eventsToSend = [
      {
        name: "audit/log" as const,
        data: {
          actor: {
            userId: actor.userId,
            role: actor.role as never,
            email: actor.email,
          },
          action: `${cfg.module}.${cfg.action}`,
          module: cfg.module,
          entityType: versionRef?.entityType,
          entityId: versionRef?.entityId,
          correlationId,
          request,
        },
      },
    ];
    if (versionRef) {
      eventsToSend.push({
        name: "versioning/snapshot" as never,
        data: {
          entityType: versionRef.entityType,
          entityId: versionRef.entityId,
          before,
          after: out,
          actorId: actor.userId,
        } as never,
      });
    }
    for (const ev of eventsToSend) {
      void inngest.send(ev).catch(() => {});
    }

    return out;
  };
}
