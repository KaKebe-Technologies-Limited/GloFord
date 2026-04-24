import { inngest } from "../client";
import { db } from "@/lib/db";
import { randomBytes } from "node:crypto";

export const donationTagDonor = inngest.createFunction(
  { id: "donation-tag-donor", retries: 3 },
  { event: "subscriber/donation.succeeded" },
  async ({ event }) => {
    const { donationId, amountCents, currency } = event.data;
    const extra = event.data as typeof event.data & { donorEmail?: string; donorName?: string };
    if (!extra.donorEmail) return;

    await db.$transaction(async (tx) => {
      const subscriber = await tx.subscriber.upsert({
        where: { email: extra.donorEmail! },
        update: { name: extra.donorName ?? undefined },
        create: {
          email: extra.donorEmail!,
          name: extra.donorName,
          source: "donation",
          unsubToken: randomBytes(16).toString("hex"),
        },
      });

      const donorSegment = await tx.segment.upsert({
        where: { slug: "donors" },
        update: {},
        create: {
          slug: "donors",
          name: "Donors",
          description: "People who have donated at least once",
          isSystem: true,
        },
      });

      await tx.subscriberSegment.upsert({
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

      await tx.subscriberEvent.create({
        data: {
          subscriberId: subscriber.id,
          type: "donation.succeeded",
          payload: { donationId, amountCents, currency } as never,
        },
      });
    });
  },
);
