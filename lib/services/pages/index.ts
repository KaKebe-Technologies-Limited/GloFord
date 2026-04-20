import { revalidateTag } from "next/cache";
import { createService } from "@/lib/services/_shared";
import {
  pageCreateSchema,
  pageUpdateSchema,
  pagePublishSchema,
  pageDeleteSchema,
} from "@/lib/validators/pages";
import { NotFoundError } from "@/lib/errors";
import { tags } from "@/lib/cache";

export const createPage = createService({
  module: "pages",
  action: "create",
  schema: pageCreateSchema,
  permission: () => ({ type: "Page" }),
  exec: async ({ input, actor, tx }) => {
    const row = await tx.page.create({
      data: {
        organizationId: actor.orgId,
        slug: input.slug,
        title: input.title,
        seoTitle: input.seoTitle,
        seoDesc: input.seoDesc,
        blocks: input.blocks as never,
      },
    });
    revalidateTag(tags.pages(actor.orgId));
    return row;
  },
  version: (out) => ({ entityType: "Page", entityId: out.id }),
});

export const updatePage = createService({
  module: "pages",
  action: "update",
  schema: pageUpdateSchema,
  permission: () => ({ type: "Page" }),
  loadBefore: async ({ input, tx }) => tx.page.findUnique({ where: { id: input.id } }),
  exec: async ({ input, actor, tx }) => {
    const { id, ...rest } = input;
    const row = await tx.page.update({
      where: { id },
      data: {
        ...(rest.slug !== undefined && { slug: rest.slug }),
        ...(rest.title !== undefined && { title: rest.title }),
        ...(rest.seoTitle !== undefined && { seoTitle: rest.seoTitle }),
        ...(rest.seoDesc !== undefined && { seoDesc: rest.seoDesc }),
        ...(rest.blocks !== undefined && { blocks: rest.blocks as never }),
      },
    });
    revalidateTag(tags.pages(actor.orgId));
    revalidateTag(tags.page(actor.orgId, row.slug));
    return row;
  },
  version: (out) => ({ entityType: "Page", entityId: out.id }),
});

export const setPageStatus = createService({
  module: "pages",
  action: "publish",
  schema: pagePublishSchema,
  permission: () => ({ type: "Page" }),
  loadBefore: async ({ input, tx }) => tx.page.findUnique({ where: { id: input.id } }),
  exec: async ({ input, actor, tx }) => {
    const row = await tx.page.update({
      where: { id: input.id },
      data: {
        status: input.status,
        publishedAt: input.status === "PUBLISHED" ? new Date() : null,
      },
    });
    revalidateTag(tags.pages(actor.orgId));
    revalidateTag(tags.page(actor.orgId, row.slug));
    return row;
  },
  version: (out) => ({ entityType: "Page", entityId: out.id }),
});

export const deletePage = createService({
  module: "pages",
  action: "delete",
  schema: pageDeleteSchema,
  permission: () => ({ type: "Page" }),
  exec: async ({ input, actor, tx }) => {
    const row = await tx.page.delete({ where: { id: input.id } });
    revalidateTag(tags.pages(actor.orgId));
    revalidateTag(tags.page(actor.orgId, row.slug));
    return { id: row.id };
  },
});

// ─── Read helpers (no createService — reads don't need audit/version) ─

import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";

export function listPages(orgId: string) {
  return db.page.findMany({
    where: { organizationId: orgId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, slug: true, title: true, status: true, publishedAt: true, updatedAt: true },
  });
}

export function getPageForEdit(orgId: string, id: string) {
  return db.page.findFirst({ where: { id, organizationId: orgId } });
}

/** Public-facing cached read by slug. Revalidated via tags on publish. */
export function getPublishedPageBySlug(orgId: string, s: string) {
  return unstable_cache(
    async () => {
      const row = await db.page.findFirst({
        where: { organizationId: orgId, slug: s, status: "PUBLISHED" },
      });
      if (!row) throw new NotFoundError("Page");
      return row;
    },
    [`page-pub`, orgId, s],
    { tags: [tags.page(orgId, s), tags.pages(orgId)], revalidate: 3600 },
  )();
}
