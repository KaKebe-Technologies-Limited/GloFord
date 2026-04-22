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
import { runAsTenant } from "@/lib/tenant/context";
import { ConflictError, NotFoundError } from "@/lib/errors";

// ───────────────────────────────────────── Campaigns ──

export const createEmailCampaign = createService({
  module: "emailCampaigns",
  action: "create",
  schema: emailCampaignCreateSchema,
  permission: () => ({ type: "EmailCampaign" }),
  exec: async ({ input, actor, tx }) => {
    const { segmentIds, triggerConfig, ...rest } = input;
    return tx.emailCampaign.create({
      data: {
        organizationId: actor.orgId,
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
  exec: async ({ input, actor, tx }) => {
    const { id, segmentIds, triggerConfig, ...rest } = input;
    const row = await tx.emailCampaign.findFirst({
      where: { id, organizationId: actor.orgId },
    });
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
  exec: async ({ input, actor, tx }) => {
    const row = await tx.emailCampaign.findFirst({
      where: { id: input.id, organizationId: actor.orgId },
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
  exec: async ({ input, actor, tx }) => {
    const row = await tx.emailCampaign.findFirst({
      where: { id: input.id, organizationId: actor.orgId },
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
  exec: async ({ input, actor, tx }) => {
    const parent = await tx.emailCampaign.findFirst({
      where: { id: input.campaignId, organizationId: actor.orgId },
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
  exec: async ({ input, actor, tx }) => {
    const { id, ...rest } = input;
    const existing = await tx.campaignEmail.findUnique({
      where: { id },
      include: { campaign: { select: { organizationId: true } } },
    });
    if (!existing || existing.campaign.organizationId !== actor.orgId) {
      throw new NotFoundError("Email step not found");
    }
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
  exec: async ({ input, actor, tx }) => {
    const existing = await tx.campaignEmail.findUnique({
      where: { id: input.id },
      include: { campaign: { select: { organizationId: true } } },
    });
    if (!existing || existing.campaign.organizationId !== actor.orgId) {
      throw new NotFoundError("Email step not found");
    }
    await tx.campaignEmail.delete({ where: { id: input.id } });
    return { id: input.id };
  },
});

// ───────────────────────────────────────── Reads ──

export function listEmailCampaigns(orgId: string) {
  return runAsTenant(orgId, (tx) =>
    tx.emailCampaign.findMany({
      where: { organizationId: orgId },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { emails: true, enrollments: true } },
        segments: { select: { id: true, name: true } },
      },
    }),
  );
}

export async function getCampaignEmailForEdit(orgId: string, id: string) {
  return runAsTenant(orgId, (tx) =>
    tx.campaignEmail.findFirst({
      where: { id, campaign: { organizationId: orgId } },
      include: { campaign: { select: { id: true, name: true } } },
    }),
  );
}

export function getEmailCampaignForEdit(orgId: string, id: string) {
  return runAsTenant(orgId, (tx) =>
    tx.emailCampaign.findFirst({
      where: { id, organizationId: orgId },
      include: {
        emails: { orderBy: { stepOrder: "asc" } },
        segments: { select: { id: true, name: true } },
        _count: { select: { enrollments: true } },
      },
    }),
  );
}
