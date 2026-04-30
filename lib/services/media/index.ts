import { createService } from "@/lib/services/_shared";
import {
  mediaFinalizeSchema,
  mediaDeleteSchema,
} from "@/lib/validators/media";
import { deleteObject, publicUrlFor } from "@/lib/storage/r2";
import { db } from "@/lib/db";

export const finalizeMediaUpload = createService({
  module: "media",
  action: "upload",
  schema: mediaFinalizeSchema,
  permission: () => ({ type: "Media" }),
  exec: async ({ input, actor, tx }) => {
    return tx.media.create({
      data: {
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
    void deleteObject(row.key).catch(() => {});
    return { id: row.id };
  },
});

export function listMedia(take = 100) {
  return db.media.findMany({
    orderBy: { createdAt: "desc" },
    take,
  });
}
