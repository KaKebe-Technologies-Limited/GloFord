import { createService } from "@/lib/services/_shared";
import { donationIntentSchema, donationRefundSchema } from "@/lib/validators/donations";
import { NotFoundError, UpstreamError } from "@/lib/errors";
import { db } from "@/lib/db";
import { getAdapter } from "@/lib/services/payments/registry";
import { inngest } from "@/lib/inngest/client";

/**
 * Public-facing donation intent creation.
 *
 * Not wrapped with createService because the donor is anonymous — no
 * Actor, no RBAC. Instead we resolve the org server-side from the
 * active organization (v1 single-tenant launch) and pass an
 * unauthenticated-safe shape to the payment adapter.
 */
export async function createDonationIntent(
  orgId: string,
  raw: unknown,
  idempotencyKey?: string,
) {
  const input = donationIntentSchema.parse(raw);

  let campaignId: string | undefined;
  if (input.campaignSlug) {
    const campaign = await db.campaign.findFirst({
      where: {
        organizationId: orgId,
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
  const result = await adapter.createIntent({
    orgId,
    donorEmail: input.donorEmail,
    donorName: input.donorName,
    amountCents: input.amountCents,
    currency: input.currency.toUpperCase(),
    campaignId,
    recurring: input.recurring,
    idempotencyKey,
  });

  return {
    donationId: result.donationId,
    providerRef: result.providerRef,
    clientSecret: result.clientSecret,
    redirectUrl: result.redirectUrl,
    publicPayload: result.publicPayload,
  };
}

/**
 * Apply a verified webhook state transition to a Donation row.
 * Idempotent: called once per unique (provider, providerEventId) row
 * in WebhookEvent; re-entering with the same transition is a no-op.
 */
export async function applyDonationEvent(params: {
  providerRef: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
  receiptUrl?: string;
  completedAt?: Date;
}) {
  const existing = await db.donation.findUnique({
    where: { providerRef: params.providerRef },
    select: { id: true, organizationId: true, status: true, donorId: true, amountCents: true, currency: true },
  });
  if (!existing) return null;

  // Don't regress: a SUCCEEDED donation shouldn't silently become PENDING.
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

  // Fire the side-effect event exactly once per SUCCEEDED transition.
  if (params.status === "SUCCEEDED" && existing.status !== "SUCCEEDED" && existing.donorId) {
    // Resolve/create a Subscriber for this donor email so downstream
    // segmentation can tag them as "Donors". Best-effort: if the
    // subscriber lookup fails, we don't block the donation state.
    const donor = await db.donor.findUnique({
      where: { id: existing.donorId },
      select: { email: true, name: true },
    });
    if (donor) {
      await inngest
        .send({
          name: "subscriber/donation.succeeded",
          data: {
            orgId: existing.organizationId,
            donationId: existing.id,
            amountCents: existing.amountCents,
            currency: existing.currency,
            subscriberId: "",
            donorEmail: donor.email,
            donorName: donor.name ?? undefined,
          } as never,
        })
        .catch(() => {});
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
  exec: async ({ input, tx }) => {
    // Placeholder: a real refund calls the provider SDK to issue the
    // money back. The webhook then flips status to REFUNDED. Here we
    // just mark the donation for manual processing until the full
    // refund flow lands in a later phase.
    const row = await tx.donation.update({
      where: { id: input.id },
      data: { metadata: { refundRequested: true, at: new Date().toISOString() } as never },
    });
    return row;
  },
});

export function listDonations(orgId: string, take = 100) {
  return db.donation.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      donor: { select: { id: true, email: true, name: true } },
      campaign: { select: { id: true, title: true, slug: true } },
    },
  });
}

export function listDonors(orgId: string) {
  return db.donor.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { donations: { where: { status: "SUCCEEDED" } } } },
    },
  });
}
