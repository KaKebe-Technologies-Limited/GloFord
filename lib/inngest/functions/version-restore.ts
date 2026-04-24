import { inngest } from "../client";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

type RestoreHandler = (
  tx: Prisma.TransactionClient,
  entityId: string,
  snapshot: unknown,
) => Promise<void>;

const HANDLERS: Record<string, RestoreHandler> = {
  Page: async (tx, id, snap) => {
    const s = snap as { title?: string; seoTitle?: string | null; seoDesc?: string | null; blocks?: unknown; slug?: string };
    await tx.page.update({
      where: { id },
      data: {
        ...(s.title !== undefined && { title: s.title }),
        ...(s.seoTitle !== undefined && { seoTitle: s.seoTitle }),
        ...(s.seoDesc !== undefined && { seoDesc: s.seoDesc }),
        ...(s.slug !== undefined && { slug: s.slug }),
        ...(s.blocks !== undefined && { blocks: s.blocks as never }),
      },
    });
  },
  Program: async (tx, id, snap) => {
    const s = snap as { title?: string; summary?: string; body?: unknown; slug?: string; order?: number };
    await tx.program.update({
      where: { id },
      data: {
        ...(s.title !== undefined && { title: s.title }),
        ...(s.summary !== undefined && { summary: s.summary }),
        ...(s.body !== undefined && { body: s.body as never }),
        ...(s.slug !== undefined && { slug: s.slug }),
        ...(s.order !== undefined && { order: s.order }),
      },
    });
  },
  Post: async (tx, id, snap) => {
    const s = snap as { title?: string; excerpt?: string | null; body?: unknown; slug?: string };
    await tx.post.update({
      where: { id },
      data: {
        ...(s.title !== undefined && { title: s.title }),
        ...(s.excerpt !== undefined && { excerpt: s.excerpt }),
        ...(s.body !== undefined && { body: s.body as never }),
        ...(s.slug !== undefined && { slug: s.slug }),
      },
    });
  },
  Newsletter: async (tx, id, snap) => {
    const s = snap as { title?: string; subject?: string; preheader?: string | null; content?: unknown; segmentIds?: string[] };
    await tx.newsletter.updateMany({
      where: { id, status: { in: ["DRAFT", "SCHEDULED"] } },
      data: {
        ...(s.title !== undefined && { title: s.title }),
        ...(s.subject !== undefined && { subject: s.subject }),
        ...(s.preheader !== undefined && { preheader: s.preheader }),
        ...(s.content !== undefined && { content: s.content as never }),
        ...(s.segmentIds !== undefined && { segmentIds: s.segmentIds }),
      },
    });
  },
  Event: async (tx, id, snap) => {
    const s = snap as {
      title?: string;
      description?: string;
      startsAt?: string | Date;
      endsAt?: string | Date | null;
      location?: string | null;
      isPublic?: boolean;
      slug?: string;
    };
    await tx.event.update({
      where: { id },
      data: {
        ...(s.title !== undefined && { title: s.title }),
        ...(s.description !== undefined && { description: s.description }),
        ...(s.startsAt !== undefined && { startsAt: new Date(s.startsAt) }),
        ...(s.endsAt !== undefined && { endsAt: s.endsAt ? new Date(s.endsAt) : null }),
        ...(s.location !== undefined && { location: s.location }),
        ...(s.isPublic !== undefined && { isPublic: s.isPublic }),
        ...(s.slug !== undefined && { slug: s.slug }),
      },
    });
  },
};

export const versionRestoreApply = inngest.createFunction(
  { id: "version-restore-apply", retries: 2 },
  { event: "version/restore.apply" },
  async ({ event, step }) => {
    const { entityType, entityId, snapshot } = event.data;
    const handler = HANDLERS[entityType];
    if (!handler) {
      return { ok: false, reason: `no-handler-for-${entityType}` };
    }
    await step.run("apply", () =>
      db.$transaction((tx) => handler(tx, entityId, snapshot)),
    );
    return { ok: true };
  },
);
