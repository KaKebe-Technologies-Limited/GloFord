import { createService } from "@/lib/services/_shared";
import {
  deadLetterRetrySchema,
  deadLetterResolveSchema,
  versionRestoreSchema,
  featureFlagUpsertSchema,
  featureFlagDeleteSchema,
} from "@/lib/validators/system";
import { NotFoundError, ConflictError } from "@/lib/errors";
import { inngest } from "@/lib/inngest/client";

// ─────────────────────────────────── Dead letter ──

/**
 * Max manual retries before the DLQ refuses to re-emit. Prevents a code
 * bug from looping forever if an operator keeps clicking "Retry".
 */
const DLQ_MAX_RETRIES = 5;

export const retryDeadLetter = createService({
  module: "deadLetter",
  action: "retry",
  schema: deadLetterRetrySchema,
  permission: () => ({ type: "DeadLetter" }),
  exec: async ({ input, actor, tx }) => {
    const dl = await tx.deadLetter.findFirst({
      where: { id: input.id, organizationId: actor.orgId },
    });
    if (!dl) throw new NotFoundError("Dead letter not found");
    if (dl.status === "RESOLVED" || dl.status === "IGNORED") {
      throw new ConflictError(`Already ${dl.status.toLowerCase()}`);
    }
    if (dl.attempts >= DLQ_MAX_RETRIES) {
      throw new ConflictError(
        `Retry cap reached (${DLQ_MAX_RETRIES} attempts). Mark as resolved or ignored instead.`,
      );
    }
    // Re-emit the original event. If the handler fails again it will
    // re-enter the dead-letter pipeline through deadletter/enqueue.
    void inngest
      .send({
        name: dl.eventType as never,
        data: dl.payload as never,
      })
      .catch(() => {});
    return tx.deadLetter.update({
      where: { id: dl.id },
      data: { status: "RETRIED", attempts: { increment: 1 } },
    });
  },
});

export const resolveDeadLetter = createService({
  module: "deadLetter",
  action: "retry",
  schema: deadLetterResolveSchema,
  permission: () => ({ type: "DeadLetter" }),
  exec: async ({ input, actor, tx }) => {
    const dl = await tx.deadLetter.findFirst({
      where: { id: input.id, organizationId: actor.orgId },
    });
    if (!dl) throw new NotFoundError("Dead letter not found");
    return tx.deadLetter.update({
      where: { id: dl.id },
      data: {
        status: input.status,
        resolvedAt: new Date(),
        resolvedById: actor.userId,
      },
    });
  },
});

// ─────────────────────────────────── Versioning ──

export const restoreVersion = createService({
  module: "versions",
  action: "restore",
  schema: versionRestoreSchema,
  permission: () => ({ type: "Version" }),
  exec: async ({ input, actor, tx }) => {
    const v = await tx.version.findFirst({
      where: { id: input.id, organizationId: actor.orgId },
    });
    if (!v) throw new NotFoundError("Version not found");
    // Actual restore logic is entity-specific and lives in per-entity
    // services. This endpoint records intent + emits an event that an
    // entity-aware handler can react to.
    // 1. Fire the actual restore (handler per entity in version-restore.ts).
    void inngest
      .send({
        name: "version/restore.apply",
        data: {
          orgId: actor.orgId,
          entityType: v.entityType,
          entityId: v.entityId,
          snapshot: v.snapshot,
          actorId: actor.userId,
        },
      })
      .catch(() => {});
    // 2. Snapshot the restore itself so version history stays monotonic.
    void inngest
      .send({
        name: "versioning/snapshot",
        data: {
          orgId: actor.orgId,
          entityType: v.entityType,
          entityId: v.entityId,
          before: null,
          after: v.snapshot,
          actorId: actor.userId,
          reason: `Restore of version ${v.version}`,
        },
      })
      .catch(() => {});
    return { id: v.id, entityType: v.entityType, entityId: v.entityId };
  },
});

// ─────────────────────────────────── Feature flags ──

export const upsertFeatureFlag = createService({
  module: "featureFlags",
  action: "update",
  schema: featureFlagUpsertSchema,
  permission: () => ({ type: "FeatureFlag" }),
  exec: async ({ input, actor, tx }) =>
    tx.featureFlag.upsert({
      where: {
        organizationId_key: { organizationId: actor.orgId, key: input.key },
      },
      create: {
        organizationId: actor.orgId,
        key: input.key,
        description: input.description,
        isEnabled: input.isEnabled,
        rules: (input.rules ?? undefined) as never,
      },
      update: {
        description: input.description,
        isEnabled: input.isEnabled,
        rules: (input.rules ?? undefined) as never,
      },
    }),
  version: (out) => ({ entityType: "FeatureFlag", entityId: out.id }),
});

export const deleteFeatureFlag = createService({
  module: "featureFlags",
  action: "update",
  schema: featureFlagDeleteSchema,
  permission: () => ({ type: "FeatureFlag" }),
  exec: async ({ input, actor, tx }) => {
    const row = await tx.featureFlag.findFirst({
      where: { id: input.id, organizationId: actor.orgId },
    });
    if (!row) throw new NotFoundError("Feature flag not found");
    await tx.featureFlag.delete({ where: { id: input.id } });
    return { id: input.id };
  },
});
