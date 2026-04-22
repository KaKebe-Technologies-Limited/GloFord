import { createService } from "@/lib/services/_shared";
import {
  segmentCreateSchema,
  segmentUpdateSchema,
  segmentDeleteSchema,
} from "@/lib/validators/segments";
import { runAsTenant } from "@/lib/tenant/context";

export const createSegment = createService({
  module: "segments",
  action: "create",
  schema: segmentCreateSchema,
  permission: () => ({ type: "Segment" }),
  exec: async ({ input, actor, tx }) =>
    tx.segment.create({
      data: {
        organizationId: actor.orgId,
        slug: input.slug,
        name: input.name,
        description: input.description,
      },
    }),
  version: (out) => ({ entityType: "Segment", entityId: out.id }),
});

export const updateSegment = createService({
  module: "segments",
  action: "update",
  schema: segmentUpdateSchema,
  permission: () => ({ type: "Segment" }),
  loadBefore: async ({ input, tx }) => tx.segment.findUnique({ where: { id: input.id } }),
  exec: async ({ input, tx }) => {
    const { id, ...rest } = input;
    return tx.segment.update({
      where: { id },
      data: {
        ...(rest.slug !== undefined && { slug: rest.slug }),
        ...(rest.name !== undefined && { name: rest.name }),
        ...(rest.description !== undefined && { description: rest.description }),
      },
    });
  },
  version: (out) => ({ entityType: "Segment", entityId: out.id }),
});

export const deleteSegment = createService({
  module: "segments",
  action: "delete",
  schema: segmentDeleteSchema,
  permission: () => ({ type: "Segment" }),
  exec: async ({ input, tx }) => {
    const row = await tx.segment.findUnique({
      where: { id: input.id },
      select: { isSystem: true },
    });
    if (row?.isSystem) {
      throw new Error("System segments cannot be deleted");
    }
    await tx.segment.delete({ where: { id: input.id } });
    return { id: input.id };
  },
});

export function listSegments(orgId: string) {
  return runAsTenant(orgId, (tx) =>
    tx.segment.findMany({
      where: { organizationId: orgId },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
      include: { _count: { select: { subscribers: true } } },
    }),
  );
}
