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

const DLQ_MAX_RETRIES = 5;

export const retryDeadLetter = createService({
  module: "deadLetter",
  action: "retry",
  schema: deadLetterRetrySchema,
  permission: () => ({ type: "DeadLetter" }),
  exec: async ({ input, tx }) => {
    const dl = await tx.deadLetter.findUnique({ where: { id: input.id } });
    if (!dl) throw new NotFoundError("Dead letter not found");
    if (dl.status === "RESOLVED" || dl.status === "IGNORED") {
      throw new ConflictError(`Already ${dl.status.toLowerCase()}`);
    }
    if (dl.attempts >= DLQ_MAX_RETRIES) {
      throw new ConflictError(
        `Retry cap reached (${DLQ_MAX_RETRIES} attempts). Mark as resolved or ignored instead.`,
      );
    }
    void inngest
      .send({ name: dl.eventType as never, data: dl.payload as never })
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
    const dl = await tx.deadLetter.findUnique({ where: { id: input.id } });
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
    const v = await tx.version.findUnique({ where: { id: input.id } });
    if (!v) throw new NotFoundError("Version not found");
    void inngest
      .send({
        name: "version/restore.apply",
        data: {
          entityType: v.entityType,
          entityId: v.entityId,
          snapshot: v.snapshot,
          actorId: actor.userId,
        },
      })
      .catch(() => {});
    void inngest
      .send({
        name: "versioning/snapshot",
        data: {
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
  exec: async ({ input, tx }) =>
    tx.featureFlag.upsert({
      where: { key: input.key },
      create: {
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
  exec: async ({ input, tx }) => {
    const row = await tx.featureFlag.findUnique({ where: { id: input.id } });
    if (!row) throw new NotFoundError("Feature flag not found");
    await tx.featureFlag.delete({ where: { id: input.id } });
    return { id: input.id };
  },
});
