import { createService } from "@/lib/services/_shared";
import { donationIntentSchema, donationRefundSchema } from "@/lib/validators/donations";
import { ConflictError, NotFoundError, UpstreamError } from "@/lib/errors";
import { runAsSystem, runAsTenant } from "@/lib/tenant/context";
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
    const campaign = await runAsTenant(orgId, (tx) =>
      tx.campaign.findFirst({
        where: {
          organizationId: orgId,
          slug: input.campaignSlug,
          isActive: true,
          OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
        },
        select: { id: true, currency: true },
      }),
    );
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

  // Pass the discriminated union through untouched so the widget can
  // switch on result.kind.
  return result;
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
  // Cross-tenant lookup by provider reference — the webhook pipeline
  // doesn't know the orgId yet. SYSTEM-scoped read is safe because
  // providerRef is unique across all tenants.
  const existing = await runAsSystem((tx) =>
    tx.donation.findUnique({
      where: { providerRef: params.providerRef },
      select: {
        id: true,
        organizationId: true,
        status: true,
        donorId: true,
        amountCents: true,
        currency: true,
      },
    }),
  );
  if (!existing) return null;

  // Don't regress: a SUCCEEDED donation shouldn't silently become PENDING.
  if (existing.status === params.status) return existing;
  if (existing.status === "REFUNDED" && params.status === "SUCCEEDED") return existing;

  const updated = await runAsTenant(existing.organizationId, (tx) =>
    tx.donation.update({
      where: { id: existing.id },
      data: {
        status: params.status,
        completedAt: params.completedAt,
        receiptUrl: params.receiptUrl,
      },
    }),
  );

  // Fire the side-effect event exactly once per SUCCEEDED transition.
  if (params.status === "SUCCEEDED" && existing.status !== "SUCCEEDED" && existing.donorId) {
    const donor = await runAsTenant(existing.organizationId, (tx) =>
      tx.donor.findUnique({
        where: { id: existing.donorId! },
        select: { email: true, name: true },
      }),
    );
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
  exec: async ({ input, actor, tx }) => {
    const donation = await tx.donation.findFirst({
      where: { id: input.id, organizationId: actor.orgId },
    });
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
        `Refunds are not supported by ${adapter.label}. Process manually and mark refunded via the database.`,
      );
    }

    const result = await adapter.refund({
      orgId: actor.orgId,
      providerRef: donation.providerRef,
      amountCents: input.amountCents,
      reason: input.reason,
    });

    if (!result.ok) {
      throw new UpstreamError(`Provider did not confirm refund (ref ${result.providerRefundId ?? "none"})`);
    }

    // The provider will also emit a charge.refunded webhook that flips
    // status to REFUNDED via applyDonationEvent. We mark it optimistically
    // here so the admin list updates immediately.
    const existingMeta =
      donation.metadata && typeof donation.metadata === "object"
        ? (donation.metadata as Record<string, unknown>)
        : {};
    return tx.donation.update({
      where: { id: donation.id },
      data: {
        status: "REFUNDED",
        metadata: {
          ...existingMeta,
          refund: {
            providerRefundId: result.providerRefundId ?? null,
            amountCents: input.amountCents ?? donation.amountCents,
            reason: input.reason ?? null,
            byUserId: actor.userId,
            at: new Date().toISOString(),
          },
        } as never,
      },
    });
  },
  version: (out) => ({ entityType: "Donation", entityId: out.id }),
});

export function listDonations(orgId: string, take = 100) {
  return runAsTenant(orgId, (tx) =>
    tx.donation.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take,
      include: {
        donor: { select: { id: true, email: true, name: true } },
        campaign: { select: { id: true, title: true, slug: true } },
      },
    }),
  );
}

export function listDonors(orgId: string) {
  return runAsTenant(orgId, (tx) =>
    tx.donor.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { donations: { where: { status: "SUCCEEDED" } } } },
      },
    }),
  );
}
