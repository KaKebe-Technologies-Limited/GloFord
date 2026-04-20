import { revalidateTag, unstable_cache } from "next/cache";
import { createService } from "@/lib/services/_shared";
import {
  campaignCreateSchema,
  campaignUpdateSchema,
  campaignDeleteSchema,
  campaignToggleSchema,
} from "@/lib/validators/campaigns";
import { NotFoundError } from "@/lib/errors";
import { tags } from "@/lib/cache";
import { db } from "@/lib/db";

export const createCampaign = createService({
  module: "campaigns",
  action: "create",
  schema: campaignCreateSchema,
  permission: () => ({ type: "Campaign" }),
  exec: async ({ input, actor, tx }) => {
    const row = await tx.campaign.create({
      data: {
        organizationId: actor.orgId,
        slug: input.slug,
        title: input.title,
        description: input.description,
        goalCents: input.goalCents ?? null,
        currency: input.currency.toUpperCase(),
        startsAt: input.startsAt ?? null,
        endsAt: input.endsAt ?? null,
        programId: input.programId ?? null,
        isActive: input.isActive,
      },
    });
    revalidateTag(tags.campaigns(actor.orgId));
    return row;
  },
  version: (out) => ({ entityType: "Campaign", entityId: out.id }),
});

export const updateCampaign = createService({
  module: "campaigns",
  action: "update",
  schema: campaignUpdateSchema,
  permission: () => ({ type: "Campaign" }),
  loadBefore: async ({ input, tx }) => tx.campaign.findUnique({ where: { id: input.id } }),
  exec: async ({ input, actor, tx }) => {
    const { id, ...rest } = input;
    const row = await tx.campaign.update({
      where: { id },
      data: {
        ...(rest.slug !== undefined && { slug: rest.slug }),
        ...(rest.title !== undefined && { title: rest.title }),
        ...(rest.description !== undefined && { description: rest.description }),
        ...(rest.goalCents !== undefined && { goalCents: rest.goalCents ?? null }),
        ...(rest.currency !== undefined && { currency: rest.currency.toUpperCase() }),
        ...(rest.startsAt !== undefined && { startsAt: rest.startsAt ?? null }),
        ...(rest.endsAt !== undefined && { endsAt: rest.endsAt ?? null }),
        ...(rest.programId !== undefined && { programId: rest.programId ?? null }),
        ...(rest.isActive !== undefined && { isActive: rest.isActive }),
      },
    });
    revalidateTag(tags.campaigns(actor.orgId));
    return row;
  },
  version: (out) => ({ entityType: "Campaign", entityId: out.id }),
});

export const toggleCampaign = createService({
  module: "campaigns",
  action: "update",
  schema: campaignToggleSchema,
  permission: () => ({ type: "Campaign" }),
  exec: async ({ input, actor, tx }) => {
    const row = await tx.campaign.update({
      where: { id: input.id },
      data: { isActive: input.isActive },
    });
    revalidateTag(tags.campaigns(actor.orgId));
    return row;
  },
});

export const deleteCampaign = createService({
  module: "campaigns",
  action: "delete",
  schema: campaignDeleteSchema,
  permission: () => ({ type: "Campaign" }),
  exec: async ({ input, actor, tx }) => {
    await tx.campaign.delete({ where: { id: input.id } });
    revalidateTag(tags.campaigns(actor.orgId));
    return { id: input.id };
  },
});

// ─── Reads ─────────────────────────────────────────────────────

export function listCampaigns(orgId: string) {
  return db.campaign.findMany({
    where: { organizationId: orgId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { donations: { where: { status: "SUCCEEDED" } } } } },
  });
}

export function getCampaignForEdit(orgId: string, id: string) {
  return db.campaign.findFirst({ where: { id, organizationId: orgId } });
}

export function getActiveCampaignBySlug(orgId: string, s: string) {
  return unstable_cache(
    async () => {
      const row = await db.campaign.findFirst({
        where: {
          organizationId: orgId,
          slug: s,
          isActive: true,
          OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
        },
      });
      if (!row) throw new NotFoundError("Campaign");
      // Aggregate raised amount for progress bar.
      const agg = await db.donation.aggregate({
        where: { campaignId: row.id, status: "SUCCEEDED" },
        _sum: { amountCents: true },
        _count: { _all: true },
      });
      return {
        ...row,
        raisedCents: agg._sum.amountCents ?? 0,
        donationCount: agg._count._all,
      };
    },
    ["campaign-pub", orgId, s],
    { tags: [tags.campaigns(orgId)], revalidate: 60 },
  )();
}

export function listActiveCampaigns(orgId: string) {
  return unstable_cache(
    async () =>
      db.campaign.findMany({
        where: {
          organizationId: orgId,
          isActive: true,
          OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
        },
        orderBy: { createdAt: "desc" },
        select: { id: true, slug: true, title: true, description: true, goalCents: true, currency: true },
      }),
    ["campaigns-active", orgId],
    { tags: [tags.campaigns(orgId)], revalidate: 300 },
  )();
}
