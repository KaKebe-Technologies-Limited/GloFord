import { revalidateTag, unstable_cache } from "next/cache";
import { createService } from "@/lib/services/_shared";
import {
  pageCreateSchema,
  pageUpdateSchema,
  pagePublishSchema,
  pageDeleteSchema,
} from "@/lib/validators/pages";
import { NotFoundError } from "@/lib/errors";
import { tags } from "@/lib/cache";
import { db } from "@/lib/db";
import { getCollectionConfig, type PageCollectionKind, toCollectionSlug } from "@/lib/pages/collections";

export const createPage = createService({
  module: "pages",
  action: "create",
  schema: pageCreateSchema,
  permission: () => ({ type: "Page" }),
  exec: async ({ input, tx }) => {
    const row = await tx.page.create({
      data: {
        slug: input.slug,
        title: input.title,
        seoTitle: input.seoTitle,
        seoDesc: input.seoDesc,
        blocks: input.blocks as never,
      },
    });
    revalidateTag(tags.pages());
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
  exec: async ({ input, tx }) => {
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
    revalidateTag(tags.pages());
    revalidateTag(tags.page(row.slug));
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
  exec: async ({ input, tx }) => {
    const row = await tx.page.update({
      where: { id: input.id },
      data: {
        status: input.status,
        publishedAt: input.status === "PUBLISHED" ? new Date() : null,
      },
    });
    revalidateTag(tags.pages());
    revalidateTag(tags.page(row.slug));
    return row;
  },
  version: (out) => ({ entityType: "Page", entityId: out.id }),
});

export const deletePage = createService({
  module: "pages",
  action: "delete",
  schema: pageDeleteSchema,
  permission: () => ({ type: "Page" }),
  exec: async ({ input, tx }) => {
    const row = await tx.page.delete({ where: { id: input.id } });
    revalidateTag(tags.pages());
    revalidateTag(tags.page(row.slug));
    return { id: row.id };
  },
});

// ─── Read helpers ────────────────────────────────────────────

export function listPages() {
  return db.page.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, slug: true, title: true, status: true, publishedAt: true, updatedAt: true },
  });
}

export function listPagesByCollection(kind: PageCollectionKind) {
  const config = getCollectionConfig(kind);
  return db.page.findMany({
    where: { slug: { startsWith: config.prefix } },
    orderBy: { updatedAt: "desc" },
    select: { id: true, slug: true, title: true, status: true, publishedAt: true, updatedAt: true, seoDesc: true },
  });
}

export function getPageForEdit(id: string) {
  return db.page.findUnique({ where: { id } });
}

export function getPublishedPageBySlug(s: string) {
  return unstable_cache(
    async () => {
      const row = await db.page.findFirst({
        where: { slug: s, status: "PUBLISHED" },
      });
      if (!row) throw new NotFoundError("Page");
      return row;
    },
    [`page-pub`, s],
    { tags: [tags.page(s), tags.pages()], revalidate: 3600 },
  )();
}

export function getPublishedCollectionPage(kind: PageCollectionKind, leafSlug: string) {
  return getPublishedPageBySlug(toCollectionSlug(kind, leafSlug));
}
