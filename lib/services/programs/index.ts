import { revalidateTag, unstable_cache } from "next/cache";
import { createService } from "@/lib/services/_shared";
import {
  programCreateSchema,
  programUpdateSchema,
  programStatusSchema,
  programDeleteSchema,
} from "@/lib/validators/programs";
import { NotFoundError } from "@/lib/errors";
import { tags } from "@/lib/cache";
import { db } from "@/lib/db";

export const createProgram = createService({
  module: "programs",
  action: "create",
  schema: programCreateSchema,
  permission: () => ({ type: "Program" }),
  exec: async ({ input, tx }) => {
    const row = await tx.program.create({
      data: {
        slug: input.slug,
        title: input.title,
        summary: input.summary,
        body: input.body as never,
        coverMediaId: input.coverMediaId ?? undefined,
        order: input.order,
      },
    });
    revalidateTag(tags.programs());
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
  exec: async ({ input, tx }) => {
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
    revalidateTag(tags.programs());
    revalidateTag(tags.program(row.slug));
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
  exec: async ({ input, tx }) => {
    const row = await tx.program.update({
      where: { id: input.id },
      data: { status: input.status },
    });
    revalidateTag(tags.programs());
    revalidateTag(tags.program(row.slug));
    return row;
  },
  version: (out) => ({ entityType: "Program", entityId: out.id }),
});

export const deleteProgram = createService({
  module: "programs",
  action: "delete",
  schema: programDeleteSchema,
  permission: () => ({ type: "Program" }),
  exec: async ({ input, tx }) => {
    const row = await tx.program.delete({ where: { id: input.id } });
    revalidateTag(tags.programs());
    revalidateTag(tags.program(row.slug));
    return { id: row.id };
  },
});

export function listPrograms() {
  return db.program.findMany({
    orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
    select: { id: true, slug: true, title: true, status: true, order: true, updatedAt: true },
  });
}

export function getProgramForEdit(id: string) {
  return db.program.findUnique({
    where: { id },
    include: { cover: { select: { id: true, url: true } } },
  });
}

export function listPublishedPrograms() {
  return unstable_cache(
    async () =>
      db.program.findMany({
        where: { status: "PUBLISHED" },
        orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
        select: { id: true, slug: true, title: true, summary: true, coverMediaId: true, cover: { select: { url: true, alt: true } } },
      }),
    ["programs-pub"],
    { tags: [tags.programs()], revalidate: 3600 },
  )();
}

export function getPublishedProgramBySlug(s: string) {
  return unstable_cache(
    async () => {
      const row = await db.program.findFirst({
        where: { slug: s, status: "PUBLISHED" },
      });
      if (!row) throw new NotFoundError("Program");
      return row;
    },
    ["program-pub", s],
    { tags: [tags.program(s), tags.programs()], revalidate: 3600 },
  )();
}
