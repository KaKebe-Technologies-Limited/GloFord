import { createService } from "@/lib/services/_shared";
import { donationIntentSchema, donationRefundSchema } from "@/lib/validators/donations";
import { ConflictError, NotFoundError, UpstreamError } from "@/lib/errors";
import { db } from "@/lib/db";
import { getAdapter } from "@/lib/services/payments/registry";
import { inngest } from "@/lib/inngest/client";

/**
 * Public-facing donation intent creation. No actor, no RBAC — the
 * donor is anonymous.
 */
export async function createDonationIntent(raw: unknown, idempotencyKey?: string) {
  const input = donationIntentSchema.parse(raw);

  let campaignId: string | undefined;
  if (input.campaignSlug) {
    const campaign = await db.campaign.findFirst({
      where: {
        slug: input.campaignSlug,
        isActive: true,
        OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
      },
      select: { id: true, currency: true },
    });
    if (!campaign) throw new NotFoundError("Campaign");
    if (campaign.currency !== input.currency.toUpperCase()) {
      throw new UpstreamError("Campaign currency does not match request");
    }
    campaignId = campaign.id;
  }

  const adapter = getAdapter(input.provider);
  return adapter.createIntent({
    donorEmail: input.donorEmail,
    donorName: input.donorName,
    amountCents: input.amountCents,
    currency: input.currency.toUpperCase(),
    campaignId,
    recurring: input.recurring,
    idempotencyKey,
  });
}

/**
 * Apply a verified webhook state transition to a Donation row.
 * Idempotent: called once per unique (provider, providerEventId).
 */
export async function applyDonationEvent(params: {
  providerRef: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
  receiptUrl?: string;
  completedAt?: Date;
}) {
  const existing = await db.donation.findUnique({
    where: { providerRef: params.providerRef },
    select: {
      id: true,
      status: true,
      donorId: true,
      amountCents: true,
      currency: true,
    },
  });
  if (!existing) return null;

  if (existing.status === params.status) return existing;
  if (existing.status === "REFUNDED" && params.status === "SUCCEEDED") return existing;

  const updated = await db.donation.update({
    where: { id: existing.id },
    data: {
      status: params.status,
      completedAt: params.completedAt,
      receiptUrl: params.receiptUrl,
    },
  });

  if (params.status === "SUCCEEDED" && existing.status !== "SUCCEEDED" && existing.donorId) {
    const donor = await db.donor.findUnique({
      where: { id: existing.donorId },
      select: { email: true, name: true },
    });
    if (donor) {
      void Promise.resolve(
        inngest.send({
          name: "subscriber/donation.succeeded",
          data: {
            donationId: existing.id,
            amountCents: existing.amountCents,
            currency: existing.currency,
            subscriberId: "",
            donorEmail: donor.email,
            donorName: donor.name ?? undefined,
          } as never,
        }),
      ).catch(() => {});
    }
  }

  return updated;
}

export const refundDonation = createService({
  module: "donations",
  action: "refund",
  schema: donationRefundSchema,
  permission: () => ({ type: "Donation" }),
  loadBefore: async ({ input, tx }) => tx.donation.findUnique({ where: { id: input.id } }),
  exec: async ({ input, actor, tx }) => {
    const donation = await tx.donation.findUnique({ where: { id: input.id } });
    if (!donation) throw new NotFoundError("Donation not found");
    if (donation.status !== "SUCCEEDED") {
      throw new ConflictError(`Cannot refund a donation in ${donation.status} state`);
    }
    if (input.amountCents && input.amountCents > donation.amountCents) {
      throw new ConflictError("Refund amount exceeds donation amount");
    }

    const adapter = getAdapter(donation.provider);
    if (!adapter.refund) {
      throw new ConflictError(
        `Refunds are not supported by ${adapter.label}. Process manually.`,
      );
    }

    const result = await adapter.refund({
      providerRef: donation.providerRef,
      amountCents: input.amountCents,
      reason: input.reason,
    });

    if (!result.ok) {
      throw new UpstreamError(
        `Provider did not confirm refund (ref ${result.providerRefundId ?? "none"})`,
      );
    }

    return tx.donation.update({
      where: { id: donation.id },
      data: {
        status: "REFUNDED",
        refundedAt: new Date(),
        refundedById: actor.userId,
        refundReason: input.reason ?? null,
        providerRefundId: result.providerRefundId ?? null,
      },
    });
  },
  version: (out) => ({ entityType: "Donation", entityId: out.id }),
});

export async function listDonations({ page = 1, perPage = 50 }: { page?: number; perPage?: number } = {}) {
  const [rows, total] = await Promise.all([
    db.donation.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        donor: { select: { id: true, email: true, name: true } },
        campaign: { select: { id: true, title: true, slug: true } },
      },
    }),
    db.donation.count(),
  ]);
  return { rows, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

export async function listDonors({ page = 1, perPage = 50 }: { page?: number; perPage?: number } = {}) {
  const [rows, total] = await Promise.all([
    db.donor.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        _count: { select: { donations: { where: { status: "SUCCEEDED" } } } },
      },
    }),
    db.donor.count(),
  ]);
  return { rows, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}
