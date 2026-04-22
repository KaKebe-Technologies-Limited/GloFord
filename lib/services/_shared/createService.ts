import type { Prisma } from "@prisma/client";
import type { z, ZodTypeAny } from "zod";
import { headers } from "next/headers";
import { ValidationError } from "@/lib/errors";
import { authorize } from "@/lib/rbac/authorize";
import { runWithTenant, type Actor } from "@/lib/tenant/context";
import { inngest } from "@/lib/inngest/client";
import { captureException } from "@/lib/observability/sentry";

const CORRELATION_HEADER = "x-correlation-id";

/**
 * Best-effort correlation-ID read. Server Actions run inside a request
 * scope so `headers()` resolves; Inngest-triggered service calls have
 * no request headers available and simply skip the tag.
 */
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
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      undefined;
    const userAgent = h.get("user-agent") ?? undefined;
    return ip || userAgent ? { ip, userAgent } : undefined;
  } catch {
    return undefined;
  }
}

type ResourceRef = {
  type: string;
  id?: string;
  ownerId?: string;
  organizationId?: string;
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
  /** Build a ResourceRef from parsed input so RBAC can check cross-tenant + scope. */
  permission: (input: z.infer<S>, actor: Actor) => ResourceRef;
  /** Run the business logic inside a tenant-scoped transaction. */
  exec: (ctx: ServiceContext<z.infer<S>>) => Promise<TOut>;
  /** If provided, a Version snapshot is queued after the mutation succeeds. */
  version?: (out: TOut, input: z.infer<S>) => VersionRef | null;
  /** If provided, loaded BEFORE exec so versioning can diff. */
  loadBefore?: (ctx: {
    actor: Actor;
    input: z.infer<S>;
    tx: Prisma.TransactionClient;
  }) => Promise<unknown>;
};

/**
 * The one and only way to define a service. Composes:
 *   parse → authorize → transact (RLS-enforced) → audit/version events → return.
 *
 * Audit + versioning are fire-and-forget through Inngest; if they fail,
 * the mutation is already durable. See §10, §11, §14 of the blueprint.
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
      out = await runWithTenant(actor, async (tx) => {
        if (cfg.loadBefore) before = await cfg.loadBefore({ actor, input, tx });
        return cfg.exec({ actor, input, tx });
      });
    } catch (err) {
      // Capture service-layer errors before rethrowing so Sentry (or the
      // logger fallback) sees them even if the caller swallows the throw.
      captureException(err, {
        action: `${cfg.module}.${cfg.action}`,
        orgId: actor.orgId,
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
            orgId: actor.orgId,
            role: actor.role,
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
          orgId: actor.orgId,
          entityType: versionRef.entityType,
          entityId: versionRef.entityId,
          before,
          after: out,
          actorId: actor.userId,
        } as never,
      });
    }
    // Fire-and-forget — never block the request on observability.
    for (const ev of eventsToSend) {
      void inngest.send(ev).catch(() => {
        /* swallow; resilience rule §14 */
      });
    }

    return out;
  };
}
