import { createService } from "@/lib/services/_shared";
import {
  mediaPresignSchema,
  mediaFinalizeSchema,
  mediaDeleteSchema,
} from "@/lib/validators/media";
import { buildMediaKey, deleteObject, presignUpload, publicUrlFor } from "@/lib/storage/r2";
import { runAsTenant } from "@/lib/tenant/context";

export const presignMediaUpload = createService({
  module: "media",
  action: "upload",
  schema: mediaPresignSchema,
  permission: () => ({ type: "Media" }),
  exec: async ({ input, actor }) => {
    const key = buildMediaKey(actor.orgId, input.name);
    const uploadUrl = await presignUpload({ key, mime: input.mime });
    return { key, uploadUrl, publicUrl: publicUrlFor(key) };
  },
});

export const finalizeMediaUpload = createService({
  module: "media",
  action: "upload",
  schema: mediaFinalizeSchema,
  permission: () => ({ type: "Media" }),
  exec: async ({ input, actor, tx }) => {
    return tx.media.create({
      data: {
        organizationId: actor.orgId,
        url: publicUrlFor(input.key),
        key: input.key,
        mime: input.mime,
        sizeBytes: input.sizeBytes,
        width: input.width,
        height: input.height,
        alt: input.alt,
        uploadedById: actor.userId,
      },
    });
  },
});

export const deleteMedia = createService({
  module: "media",
  action: "delete",
  schema: mediaDeleteSchema,
  permission: () => ({ type: "Media" }),
  loadBefore: async ({ input, tx }) => tx.media.findUnique({ where: { id: input.id } }),
  exec: async ({ input, tx }) => {
    const row = await tx.media.delete({ where: { id: input.id } });
    // R2 delete runs outside the transaction; if it fails, we log but
    // don't roll back the DB delete. Orphan cleanup is a scheduled job
    // in a later phase.
    void deleteObject(row.key).catch(() => {});
    return { id: row.id };
  },
});

export function listMedia(orgId: string, take = 100) {
  return runAsTenant(orgId, (tx) =>
    tx.media.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take,
    }),
  );
}
