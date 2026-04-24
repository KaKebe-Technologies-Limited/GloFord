import { inngest } from "../client";
import { db } from "@/lib/db";

export const enrollOnSignup = inngest.createFunction(
  { id: "campaign-enroll-on-signup", retries: 3 },
  { event: "subscriber/confirmed" },
  async ({ event, step }) => {
    const { subscriberId } = event.data;
    const campaigns = await step.run("find-campaigns", () =>
      db.emailCampaign.findMany({
        where: { isActive: true, trigger: "ON_SIGNUP" },
        include: {
          segments: { select: { id: true } },
          emails: { select: { id: true } },
        },
      }),
    );
    if (campaigns.length === 0) return { enrolled: 0 };

    const sub = await step.run("load-subscriber", () =>
      db.subscriber.findUnique({
        where: { id: subscriberId },
        include: { segments: { select: { segmentId: true } } },
      }),
    );
    if (!sub) return { enrolled: 0 };

    const subSegIds = new Set(sub.segments.map((s) => s.segmentId));
    let enrolled = 0;
    for (const c of campaigns) {
      if (c.emails.length === 0) continue;
      if (c.segments.length > 0 && !c.segments.some((s) => subSegIds.has(s.id))) continue;
      await step.run(`enroll-${c.id}`, () =>
        db.campaignEnrollment.upsert({
          where: {
            campaignId_subscriberId: { campaignId: c.id, subscriberId: sub.id },
          },
          create: {
            campaignId: c.id,
            subscriberId: sub.id,
            status: "ACTIVE",
            nextSendAt: new Date(),
          },
          update: {},
        }),
      );
      enrolled++;
    }
    return { enrolled };
  },
);

export const enrollOnDonation = inngest.createFunction(
  { id: "campaign-enroll-on-donation", retries: 3 },
  { event: "subscriber/donation.succeeded" },
  async ({ event, step }) => {
    const { subscriberId } = event.data;
    const campaigns = await step.run("find-campaigns", () =>
      db.emailCampaign.findMany({
        where: { isActive: true, trigger: "ON_DONATION" },
        include: {
          segments: { select: { id: true } },
          emails: { select: { id: true } },
        },
      }),
    );
    if (campaigns.length === 0) return { enrolled: 0 };

    const sub = await step.run("load-subscriber", () =>
      db.subscriber.findUnique({
        where: { id: subscriberId },
        include: { segments: { select: { segmentId: true } } },
      }),
    );
    if (!sub) return { enrolled: 0 };

    const subSegIds = new Set(sub.segments.map((s) => s.segmentId));
    let enrolled = 0;
    for (const c of campaigns) {
      if (c.emails.length === 0) continue;
      if (c.segments.length > 0 && !c.segments.some((s) => subSegIds.has(s.id))) continue;
      await step.run(`enroll-${c.id}`, () =>
        db.campaignEnrollment.upsert({
          where: {
            campaignId_subscriberId: { campaignId: c.id, subscriberId: sub.id },
          },
          create: {
            campaignId: c.id,
            subscriberId: sub.id,
            status: "ACTIVE",
            nextSendAt: new Date(),
          },
          update: { status: "ACTIVE", nextSendAt: new Date() },
        }),
      );
      enrolled++;
    }
    return { enrolled };
  },
);
