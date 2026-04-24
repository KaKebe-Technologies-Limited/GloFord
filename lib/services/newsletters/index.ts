import { createService } from "@/lib/services/_shared";
import {
  newsletterCreateSchema,
  newsletterUpdateSchema,
  newsletterScheduleSchema,
  newsletterSendNowSchema,
  newsletterDeleteSchema,
} from "@/lib/validators/newsletters";
import { db } from "@/lib/db";
import { inngest } from "@/lib/inngest/client";
import { ConflictError } from "@/lib/errors";

export const createNewsletter = createService({
  module: "newsletters",
  action: "create",
  schema: newsletterCreateSchema,
  permission: () => ({ type: "Newsletter" }),
  exec: async ({ input, actor, tx }) =>
    tx.newsletter.create({
      data: {
        title: input.title,
        subject: input.subject,
        preheader: input.preheader,
        content: input.content as never,
        segmentIds: input.segmentIds,
        createdById: actor.userId,
      },
    }),
  version: (out) => ({ entityType: "Newsletter", entityId: out.id }),
});

export const updateNewsletter = createService({
  module: "newsletters",
  action: "update",
  schema: newsletterUpdateSchema,
  permission: () => ({ type: "Newsletter" }),
  loadBefore: async ({ input, tx }) => tx.newsletter.findUnique({ where: { id: input.id } }),
  exec: async ({ input, tx }) => {
    const { id, ...rest } = input;
    const existing = await tx.newsletter.findUnique({ where: { id }, select: { status: true } });
    if (existing?.status && ["SENDING", "SENT"].includes(existing.status)) {
      throw new ConflictError("Sent newsletters cannot be edited");
    }
    return tx.newsletter.update({
      where: { id },
      data: {
        ...(rest.title !== undefined && { title: rest.title }),
        ...(rest.subject !== undefined && { subject: rest.subject }),
        ...(rest.preheader !== undefined && { preheader: rest.preheader }),
        ...(rest.content !== undefined && { content: rest.content as never }),
        ...(rest.segmentIds !== undefined && { segmentIds: rest.segmentIds }),
      },
    });
  },
  version: (out) => ({ entityType: "Newsletter", entityId: out.id }),
});

export const scheduleNewsletter = createService({
  module: "newsletters",
  action: "send",
  schema: newsletterScheduleSchema,
  permission: () => ({ type: "Newsletter" }),
  exec: async ({ input, tx }) =>
    tx.newsletter.update({
      where: { id: input.id },
      data: {
        scheduledAt: input.scheduledAt,
        status: input.scheduledAt ? "SCHEDULED" : "DRAFT",
      },
    }),
});

export const sendNewsletterNow = createService({
  module: "newsletters",
  action: "send",
  schema: newsletterSendNowSchema,
  permission: () => ({ type: "Newsletter" }),
  exec: async ({ input, tx }) => {
    const row = await tx.newsletter.update({
      where: { id: input.id },
      data: { status: "SENDING", scheduledAt: null },
    });
    void inngest
      .send({
        name: "newsletter/send",
        data: { newsletterId: row.id },
      })
      .catch(() => {});
    return row;
  },
});

export const deleteNewsletter = createService({
  module: "newsletters",
  action: "delete",
  schema: newsletterDeleteSchema,
  permission: () => ({ type: "Newsletter" }),
  exec: async ({ input, tx }) => {
    const row = await tx.newsletter.findUnique({
      where: { id: input.id },
      select: { status: true },
    });
    if (row?.status === "SENDING" || row?.status === "SENT") {
      throw new ConflictError("Sent newsletters cannot be deleted");
    }
    await tx.newsletter.delete({ where: { id: input.id } });
    return { id: input.id };
  },
});

export function listNewsletters() {
  return db.newsletter.findMany({ orderBy: { updatedAt: "desc" } });
}

export function getNewsletterForEdit(id: string) {
  return db.newsletter.findUnique({ where: { id } });
}
