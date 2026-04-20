import type { Prisma } from "@prisma/client";
import type { ZodType } from "zod";
import { ValidationError } from "@/lib/errors";
import { authorize } from "@/lib/rbac/authorize";
import { runWithTenant, type Actor } from "@/lib/tenant/context";
import { inngest } from "@/lib/inngest/client";

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

export type ServiceConfig<TInput, TOut> = {
  module: string;
  action: string;
  schema: ZodType<TInput>;
  /** Build a ResourceRef from parsed input so RBAC can check cross-tenant + scope. */
  permission: (input: TInput, actor: Actor) => ResourceRef;
  /** Run the business logic inside a tenant-scoped transaction. */
  exec: (ctx: ServiceContext<TInput>) => Promise<TOut>;
  /** If provided, a Version snapshot is queued after the mutation succeeds. */
  version?: (out: TOut, input: TInput) => VersionRef | null;
  /** If provided, loaded BEFORE exec so versioning can diff. */
  loadBefore?: (ctx: { actor: Actor; input: TInput; tx: Prisma.TransactionClient }) => Promise<unknown>;
};

/**
 * The one and only way to define a service. Composes:
 *   parse → authorize → transact (RLS-enforced) → audit/version events → return.
 *
 * Audit + versioning are fire-and-forget through Inngest; if they fail,
 * the mutation is already durable. See §10, §11, §14 of the blueprint.
 */
export function createService<TInput, TOut>(cfg: ServiceConfig<TInput, TOut>) {
  return async (actor: Actor, raw: unknown): Promise<TOut> => {
    const parsed = cfg.schema.safeParse(raw);
    if (!parsed.success) throw new ValidationError("Invalid input", parsed.error.flatten());
    const input = parsed.data;

    await authorize(actor, `${cfg.module}.${cfg.action}`, cfg.permission(input, actor));

    let before: unknown = null;
    const out = await runWithTenant(actor, async (tx) => {
      if (cfg.loadBefore) before = await cfg.loadBefore({ actor, input, tx });
      return cfg.exec({ actor, input, tx });
    });

    const ref = cfg.version?.(out, input) ?? null;
    const eventsToSend: Parameters<typeof inngest.send>[0][] = [
      {
        name: "audit/log",
        data: {
          actor: { userId: actor.userId, orgId: actor.orgId, role: actor.role, email: actor.email },
          action: `${cfg.module}.${cfg.action}`,
          module: cfg.module,
          entityType: ref?.entityType,
          entityId: ref?.entityId,
        },
      },
    ];
    if (ref) {
      eventsToSend.push({
        name: "versioning/snapshot",
        data: {
          orgId: actor.orgId,
          entityType: ref.entityType,
          entityId: ref.entityId,
          before,
          after: out,
          actorId: actor.userId,
        },
      });
    }
    // Fire-and-forget — never block the request on observability.
    void inngest.send(eventsToSend).catch(() => {
      /* swallow; resilience rule §14 */
    });

    return out;
  };
}
