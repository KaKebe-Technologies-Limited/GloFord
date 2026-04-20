import { revalidateTag, unstable_cache } from "next/cache";
import { createService } from "@/lib/services/_shared";
import {
  postCreateSchema,
  postUpdateSchema,
  postStatusSchema,
  postDeleteSchema,
} from "@/lib/validators/posts";
import { NotFoundError } from "@/lib/errors";
import { tags } from "@/lib/cache";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/** Upsert tags for the org and return their ids, preserving order. */
async function upsertTags(
  tx: Prisma.TransactionClient,
  orgId: string,
  slugs: string[],
): Promise<string[]> {
  const ids: string[] = [];
  for (const s of slugs) {
    const tag = await tx.tag.upsert({
      where: { organizationId_slug: { organizationId: orgId, slug: s } },
      update: {},
      create: { organizationId: orgId, slug: s, name: s.replace(/-/g, " ") },
      select: { id: true },
    });
    ids.push(tag.id);
  }
  return ids;
}

export const createPost = createService({
  module: "posts",
  action: "create",
  schema: postCreateSchema,
  permission: () => ({ type: "Post" }),
  exec: async ({ input, actor, tx }) => {
    const tagIds = await upsertTags(tx, actor.orgId, input.tagSlugs);
    const row = await tx.post.create({
      data: {
        organizationId: actor.orgId,
        slug: input.slug,
        title: input.title,
        excerpt: input.excerpt,
        body: input.body as never,
        coverMediaId: input.coverMediaId ?? undefined,
        authorId: actor.userId,
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
      },
    });
    revalidateTag(tags.posts(actor.orgId));
    return row;
  },
  version: (out) => ({ entityType: "Post", entityId: out.id }),
});

export const updatePost = createService({
  module: "posts",
  action: "update",
  schema: postUpdateSchema,
  permission: () => ({ type: "Post" }),
  loadBefore: async ({ input, tx }) =>
    tx.post.findUnique({ where: { id: input.id }, include: { tags: true } }),
  exec: async ({ input, actor, tx }) => {
    const { id, tagSlugs, ...rest } = input;
    const row = await tx.post.update({
      where: { id },
      data: {
        ...(rest.slug !== undefined && { slug: rest.slug }),
        ...(rest.title !== undefined && { title: rest.title }),
        ...(rest.excerpt !== undefined && { excerpt: rest.excerpt }),
        ...(rest.body !== undefined && { body: rest.body as never }),
        ...(rest.coverMediaId !== undefined && { coverMediaId: rest.coverMediaId }),
      },
    });

    if (tagSlugs !== undefined) {
      const tagIds = await upsertTags(tx, actor.orgId, tagSlugs);
      await tx.postTag.deleteMany({ where: { postId: id } });
      await tx.postTag.createMany({
        data: tagIds.map((tagId) => ({ postId: id, tagId })),
        skipDuplicates: true,
      });
    }

    revalidateTag(tags.posts(actor.orgId));
    revalidateTag(tags.post(actor.orgId, row.slug));
    return row;
  },
  version: (out) => ({ entityType: "Post", entityId: out.id }),
});

export const setPostStatus = createService({
  module: "posts",
  action: "publish",
  schema: postStatusSchema,
  permission: () => ({ type: "Post" }),
  loadBefore: async ({ input, tx }) => tx.post.findUnique({ where: { id: input.id } }),
  exec: async ({ input, actor, tx }) => {
    const row = await tx.post.update({
      where: { id: input.id },
      data: {
        status: input.status,
        publishedAt: input.status === "PUBLISHED" ? new Date() : null,
      },
    });
    revalidateTag(tags.posts(actor.orgId));
    revalidateTag(tags.post(actor.orgId, row.slug));
    return row;
  },
  version: (out) => ({ entityType: "Post", entityId: out.id }),
});

export const deletePost = createService({
  module: "posts",
  action: "delete",
  schema: postDeleteSchema,
  permission: () => ({ type: "Post" }),
  exec: async ({ input, actor, tx }) => {
    const row = await tx.post.delete({ where: { id: input.id } });
    revalidateTag(tags.posts(actor.orgId));
    revalidateTag(tags.post(actor.orgId, row.slug));
    return { id: row.id };
  },
});

export function listPosts(orgId: string) {
  return db.post.findMany({
    where: { organizationId: orgId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, slug: true, title: true, status: true, publishedAt: true, updatedAt: true,
      author: { select: { name: true, email: true } },
    },
  });
}

export function getPostForEdit(orgId: string, id: string) {
  return db.post.findFirst({
    where: { id, organizationId: orgId },
    include: { tags: { include: { tag: true } } },
  });
}

export function listPublishedPosts(orgId: string, take = 20) {
  return unstable_cache(
    async () =>
      db.post.findMany({
        where: { organizationId: orgId, status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take,
        select: {
          id: true, slug: true, title: true, excerpt: true, publishedAt: true,
        },
      }),
    ["posts-pub", orgId, String(take)],
    { tags: [tags.posts(orgId)], revalidate: 3600 },
  )();
}

export function getPublishedPostBySlug(orgId: string, s: string) {
  return unstable_cache(
    async () => {
      const row = await db.post.findFirst({
        where: { organizationId: orgId, slug: s, status: "PUBLISHED" },
        include: { author: { select: { name: true } }, tags: { include: { tag: true } } },
      });
      if (!row) throw new NotFoundError("Post");
      return row;
    },
    ["post-pub", orgId, s],
    { tags: [tags.post(orgId, s), tags.posts(orgId)], revalidate: 3600 },
  )();
}
