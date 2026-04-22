import { revalidateTag } from "next/cache";
import { unstable_cache } from "next/cache";
import { createService } from "@/lib/services/_shared";
import {
  programCreateSchema,
  programUpdateSchema,
  programStatusSchema,
  programDeleteSchema,
} from "@/lib/validators/programs";
import { NotFoundError } from "@/lib/errors";
import { tags } from "@/lib/cache";
import { runAsTenant } from "@/lib/tenant/context";

export const createProgram = createService({
  module: "programs",
  action: "create",
  schema: programCreateSchema,
  permission: () => ({ type: "Program" }),
  exec: async ({ input, actor, tx }) => {
    const row = await tx.program.create({
      data: {
        organizationId: actor.orgId,
        slug: input.slug,
        title: input.title,
        summary: input.summary,
        body: input.body as never,
        coverMediaId: input.coverMediaId ?? undefined,
        order: input.order,
      },
    });
    revalidateTag(tags.programs(actor.orgId));
    return row;
  },
  version: (out) => ({ entityType: "Program", entityId: out.id }),
});

export const updateProgram = createService({
  module: "programs",
  action: "update",
  schema: programUpdateSchema,
  permission: () => ({ type: "Program" }),
  loadBefore: async ({ input, tx }) => tx.program.findUnique({ where: { id: input.id } }),
  exec: async ({ input, actor, tx }) => {
    const { id, ...rest } = input;
    const row = await tx.program.update({
      where: { id },
      data: {
        ...(rest.slug !== undefined && { slug: rest.slug }),
        ...(rest.title !== undefined && { title: rest.title }),
        ...(rest.summary !== undefined && { summary: rest.summary }),
        ...(rest.body !== undefined && { body: rest.body as never }),
        ...(rest.coverMediaId !== undefined && { coverMediaId: rest.coverMediaId }),
        ...(rest.order !== undefined && { order: rest.order }),
      },
    });
    revalidateTag(tags.programs(actor.orgId));
    revalidateTag(tags.program(actor.orgId, row.slug));
    return row;
  },
  version: (out) => ({ entityType: "Program", entityId: out.id }),
});

export const setProgramStatus = createService({
  module: "programs",
  action: "publish",
  schema: programStatusSchema,
  permission: () => ({ type: "Program" }),
  loadBefore: async ({ input, tx }) => tx.program.findUnique({ where: { id: input.id } }),
  exec: async ({ input, actor, tx }) => {
    const row = await tx.program.update({
      where: { id: input.id },
      data: { status: input.status },
    });
    revalidateTag(tags.programs(actor.orgId));
    revalidateTag(tags.program(actor.orgId, row.slug));
    return row;
  },
  version: (out) => ({ entityType: "Program", entityId: out.id }),
});

export const deleteProgram = createService({
  module: "programs",
  action: "delete",
  schema: programDeleteSchema,
  permission: () => ({ type: "Program" }),
  exec: async ({ input, actor, tx }) => {
    const row = await tx.program.delete({ where: { id: input.id } });
    revalidateTag(tags.programs(actor.orgId));
    revalidateTag(tags.program(actor.orgId, row.slug));
    return { id: row.id };
  },
});

export function listPrograms(orgId: string) {
  return runAsTenant(orgId, (tx) =>
    tx.program.findMany({
      where: { organizationId: orgId },
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
      select: { id: true, slug: true, title: true, status: true, order: true, updatedAt: true },
    }),
  );
}

export function getProgramForEdit(orgId: string, id: string) {
  return runAsTenant(orgId, (tx) =>
    tx.program.findFirst({ where: { id, organizationId: orgId } }),
  );
}

export function listPublishedPrograms(orgId: string) {
  return unstable_cache(
    async () =>
      runAsTenant(orgId, (tx) =>
        tx.program.findMany({
          where: { organizationId: orgId, status: "PUBLISHED" },
          orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
          select: { id: true, slug: true, title: true, summary: true },
        }),
      ),
    ["programs-pub", orgId],
    { tags: [tags.programs(orgId)], revalidate: 3600 },
  )();
}

export function getPublishedProgramBySlug(orgId: string, s: string) {
  return unstable_cache(
    async () => {
      const row = await runAsTenant(orgId, (tx) =>
        tx.program.findFirst({
          where: { organizationId: orgId, slug: s, status: "PUBLISHED" },
        }),
      );
      if (!row) throw new NotFoundError("Program");
      return row;
    },
    ["program-pub", orgId, s],
    { tags: [tags.program(orgId, s), tags.programs(orgId)], revalidate: 3600 },
  )();
}
