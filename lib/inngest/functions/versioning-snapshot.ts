import * as jsondiffpatch from "jsondiffpatch";
import { inngest } from "../client";
import { db } from "@/lib/db";

const differ = jsondiffpatch.create({
  objectHash: (obj: unknown) => (obj as { id?: string })?.id,
  arrays: { detectMove: true },
  textDiff: { minLength: 80 },
});

/**
 * Snapshot writer. Computes a monotonic per-entity version number and
 * stores both the full `after` state and the diff vs `before`.
 *
 * Fire-and-forget: if this fails, the mutation still succeeded.
 * The version log is eventually consistent.
 */
export const versioningSnapshot = inngest.createFunction(
  { id: "versioning-snapshot", retries: 3 },
  { event: "versioning/snapshot" },
  async ({ event }) => {
    const { orgId, entityType, entityId, before, after, actorId, reason } = event.data;

    const last = await db.version.findFirst({
      where: { entityType, entityId },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    const diff = before ? differ.diff(before, after) ?? undefined : undefined;

    await db.version.create({
      data: {
        organizationId: orgId,
        entityType,
        entityId,
        snapshot: after as never,
        diff: diff as never,
        version: (last?.version ?? 0) + 1,
        createdById: actorId,
        reason,
      },
    });
  },
);
