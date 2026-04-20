import { inngest } from "../client";
import { db } from "@/lib/db";
import { randomBytes } from "node:crypto";

/**
 * On donation.succeeded:
 *   1. Find or create a Subscriber for the donor email (PENDING until
 *      double opt-in, but already addressable by segmentation).
 *   2. Ensure the "donors" system segment exists.
 *   3. Link subscriber to segment (source=EVENT, idempotent).
 *   4. Write a SubscriberEvent for the audit trail + automation
 *      triggers (ON_DONATION EmailCampaigns consume this).
 *
 * Fire-and-forget from applyDonationEvent. Failing this function does
 * not affect the donation itself — the user's donation is already
 * durable in the Donation table.
 */
export const donationTagDonor = inngest.createFunction(
  { id: "donation-tag-donor", retries: 3 },
  { event: "subscriber/donation.succeeded" },
  async ({ event }) => {
    const { orgId, donationId, amountCents, currency } = event.data;
    // The event payload may include donorEmail/donorName when fired
    // directly from applyDonationEvent (they are stored as extra fields
    // for convenience; the schema only requires the declared ones).
    const extra = event.data as typeof event.data & { donorEmail?: string; donorName?: string };
    if (!extra.donorEmail) return;

    const subscriber = await db.subscriber.upsert({
      where: {
        organizationId_email: { organizationId: orgId, email: extra.donorEmail },
      },
      update: { name: extra.donorName ?? undefined },
      create: {
        organizationId: orgId,
        email: extra.donorEmail,
        name: extra.donorName,
        source: "donation",
        unsubToken: randomBytes(16).toString("hex"),
      },
    });

    const donorSegment = await db.segment.upsert({
      where: { organizationId_slug: { organizationId: orgId, slug: "donors" } },
      update: {},
      create: {
        organizationId: orgId,
        slug: "donors",
        name: "Donors",
        description: "People who have donated at least once",
        isSystem: true,
      },
    });

    await db.subscriberSegment.upsert({
      where: {
        subscriberId_segmentId: { subscriberId: subscriber.id, segmentId: donorSegment.id },
      },
      update: {},
      create: {
        subscriberId: subscriber.id,
        segmentId: donorSegment.id,
        source: "EVENT",
      },
    });

    await db.subscriberEvent.create({
      data: {
        subscriberId: subscriber.id,
        type: "donation.succeeded",
        payload: { donationId, amountCents, currency } as never,
      },
    });
  },
);
