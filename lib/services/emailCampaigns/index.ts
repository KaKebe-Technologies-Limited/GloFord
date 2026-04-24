import { createService } from "@/lib/services/_shared";
import {
  emailCampaignCreateSchema,
  emailCampaignUpdateSchema,
  emailCampaignDeleteSchema,
  emailCampaignActivateSchema,
  campaignEmailCreateSchema,
  campaignEmailUpdateSchema,
  campaignEmailDeleteSchema,
} from "@/lib/validators/emailCampaigns";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { db } from "@/lib/db";

// ───────────────────────────────────────── Campaigns ──

export const createEmailCampaign = createService({
  module: "emailCampaigns",
  action: "create",
  schema: emailCampaignCreateSchema,
  permission: () => ({ type: "EmailCampaign" }),
  exec: async ({ input, tx }) => {
    const { segmentIds, triggerConfig, ...rest } = input;
    return tx.emailCampaign.create({
      data: {
        ...rest,
        triggerConfig: (triggerConfig ?? {}) as never,
        segments: segmentIds.length
          ? { connect: segmentIds.map((id) => ({ id })) }
          : undefined,
      },
    });
  },
  version: (out) => ({ entityType: "EmailCampaign", entityId: out.id }),
});

export const updateEmailCampaign = createService({
  module: "emailCampaigns",
  action: "update",
  schema: emailCampaignUpdateSchema,
  permission: () => ({ type: "EmailCampaign" }),
  loadBefore: async ({ input, tx }) =>
    tx.emailCampaign.findUnique({ where: { id: input.id } }),
  exec: async ({ input, tx }) => {
    const { id, segmentIds, triggerConfig, ...rest } = input;
    const row = await tx.emailCampaign.findUnique({ where: { id } });
    if (!row) throw new NotFoundError("Campaign not found");
    return tx.emailCampaign.update({
      where: { id },
      data: {
        ...rest,
        ...(triggerConfig !== undefined && { triggerConfig: triggerConfig as never }),
        ...(segmentIds !== undefined && {
          segments: { set: segmentIds.map((sid) => ({ id: sid })) },
        }),
      },
    });
  },
  version: (out) => ({ entityType: "EmailCampaign", entityId: out.id }),
});

export const deleteEmailCampaign = createService({
  module: "emailCampaigns",
  action: "delete",
  schema: emailCampaignDeleteSchema,
  permission: () => ({ type: "EmailCampaign" }),
  exec: async ({ input, tx }) => {
    const row = await tx.emailCampaign.findUnique({
      where: { id: input.id },
      select: { id: true, _count: { select: { enrollments: true } } },
    });
    if (!row) throw new NotFoundError("Campaign not found");
    if (row._count.enrollments > 0) {
      throw new ConflictError(
        "Cannot delete a campaign with active enrollments. Deactivate it first.",
      );
    }
    await tx.emailCampaign.delete({ where: { id: input.id } });
    return { id: input.id };
  },
});

export const activateEmailCampaign = createService({
  module: "emailCampaigns",
  action: "activate",
  schema: emailCampaignActivateSchema,
  permission: () => ({ type: "EmailCampaign" }),
  exec: async ({ input, tx }) => {
    const row = await tx.emailCampaign.findUnique({
      where: { id: input.id },
      include: { emails: { select: { id: true } } },
    });
    if (!row) throw new NotFoundError("Campaign not found");
    if (input.isActive && row.emails.length === 0) {
      throw new ConflictError("Add at least one email step before activating.");
    }
    return tx.emailCampaign.update({
      where: { id: input.id },
      data: { isActive: input.isActive },
    });
  },
  version: (out) => ({ entityType: "EmailCampaign", entityId: out.id }),
});

// ───────────────────────────────────── Email steps ──

export const createCampaignEmail = createService({
  module: "emailCampaigns",
  action: "update",
  schema: campaignEmailCreateSchema,
  permission: () => ({ type: "CampaignEmail" }),
  exec: async ({ input, tx }) => {
    const parent = await tx.emailCampaign.findUnique({
      where: { id: input.campaignId },
      select: { id: true },
    });
    if (!parent) throw new NotFoundError("Campaign not found");
    return tx.campaignEmail.create({
      data: {
        campaignId: input.campaignId,
        stepOrder: input.stepOrder,
        subject: input.subject,
        preheader: input.preheader,
        content: input.content as never,
        delayMinutes: input.delayMinutes,
      },
    });
  },
});

export const updateCampaignEmail = createService({
  module: "emailCampaigns",
  action: "update",
  schema: campaignEmailUpdateSchema,
  permission: () => ({ type: "CampaignEmail" }),
  exec: async ({ input, tx }) => {
    const { id, ...rest } = input;
    const existing = await tx.campaignEmail.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Email step not found");
    return tx.campaignEmail.update({
      where: { id },
      data: {
        ...(rest.stepOrder !== undefined && { stepOrder: rest.stepOrder }),
        ...(rest.subject !== undefined && { subject: rest.subject }),
        ...(rest.preheader !== undefined && { preheader: rest.preheader }),
        ...(rest.content !== undefined && { content: rest.content as never }),
        ...(rest.delayMinutes !== undefined && { delayMinutes: rest.delayMinutes }),
      },
    });
  },
});

export const deleteCampaignEmail = createService({
  module: "emailCampaigns",
  action: "update",
  schema: campaignEmailDeleteSchema,
  permission: () => ({ type: "CampaignEmail" }),
  exec: async ({ input, tx }) => {
    const existing = await tx.campaignEmail.findUnique({ where: { id: input.id } });
    if (!existing) throw new NotFoundError("Email step not found");
    await tx.campaignEmail.delete({ where: { id: input.id } });
    return { id: input.id };
  },
});

// ───────────────────────────────────────── Reads ──

export function listEmailCampaigns() {
  return db.emailCampaign.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { emails: true, enrollments: true } },
      segments: { select: { id: true, name: true } },
    },
  });
}

export function getCampaignEmailForEdit(id: string) {
  return db.campaignEmail.findUnique({
    where: { id },
    include: { campaign: { select: { id: true, name: true } } },
  });
}

export function getEmailCampaignForEdit(id: string) {
  return db.emailCampaign.findUnique({
    where: { id },
    include: {
      emails: { orderBy: { stepOrder: "asc" } },
      segments: { select: { id: true, name: true } },
      _count: { select: { enrollments: true } },
    },
  });
}
