import { inngest } from "../client";
import { runAsTenant } from "@/lib/tenant/context";

/**
 * Enroll subscribers into active ON_SIGNUP email campaigns whenever a
 * subscriber confirms (the moment they become ACTIVE).
 *
 * All DB touches run under runAsTenant so they still pass the tenant
 * RLS policy.
 */
export const enrollOnSignup = inngest.createFunction(
  { id: "campaign-enroll-on-signup", retries: 3 },
  { event: "subscriber/confirmed" },
  async ({ event, step }) => {
    const { orgId, subscriberId } = event.data;
    const campaigns = await step.run("find-campaigns", () =>
      runAsTenant(orgId, (tx) =>
        tx.emailCampaign.findMany({
          where: {
            organizationId: orgId,
            isActive: true,
            trigger: "ON_SIGNUP",
          },
          include: {
            segments: { select: { id: true } },
            emails: { select: { id: true } },
          },
        }),
      ),
    );
    if (campaigns.length === 0) return { enrolled: 0 };

    const sub = await step.run("load-subscriber", () =>
      runAsTenant(orgId, (tx) =>
        tx.subscriber.findUnique({
          where: { id: subscriberId },
          include: { segments: { select: { segmentId: true } } },
        }),
      ),
    );
    if (!sub) return { enrolled: 0 };

    const subSegIds = new Set(sub.segments.map((s) => s.segmentId));
    let enrolled = 0;
    for (const c of campaigns) {
      if (c.emails.length === 0) continue;
      if (c.segments.length > 0 && !c.segments.some((s) => subSegIds.has(s.id))) continue;
      await step.run(`enroll-${c.id}`, () =>
        runAsTenant(orgId, (tx) =>
          tx.campaignEnrollment.upsert({
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
        ),
      );
      enrolled++;
    }
    return { enrolled };
  },
);

/**
 * Same pattern for ON_DONATION campaigns — fires off
 * subscriber/donation.succeeded which is emitted by donation-tag-donor
 * after a donation completes and a subscriber is linked.
 */
export const enrollOnDonation = inngest.createFunction(
  { id: "campaign-enroll-on-donation", retries: 3 },
  { event: "subscriber/donation.succeeded" },
  async ({ event, step }) => {
    const { orgId, subscriberId } = event.data;
    const campaigns = await step.run("find-campaigns", () =>
      runAsTenant(orgId, (tx) =>
        tx.emailCampaign.findMany({
          where: {
            organizationId: orgId,
            isActive: true,
            trigger: "ON_DONATION",
          },
          include: {
            segments: { select: { id: true } },
            emails: { select: { id: true } },
          },
        }),
      ),
    );
    if (campaigns.length === 0) return { enrolled: 0 };

    const sub = await step.run("load-subscriber", () =>
      runAsTenant(orgId, (tx) =>
        tx.subscriber.findUnique({
          where: { id: subscriberId },
          include: { segments: { select: { segmentId: true } } },
        }),
      ),
    );
    if (!sub) return { enrolled: 0 };

    const subSegIds = new Set(sub.segments.map((s) => s.segmentId));
    let enrolled = 0;
    for (const c of campaigns) {
      if (c.emails.length === 0) continue;
      if (c.segments.length > 0 && !c.segments.some((s) => subSegIds.has(s.id))) continue;
      await step.run(`enroll-${c.id}`, () =>
        runAsTenant(orgId, (tx) =>
          tx.campaignEnrollment.upsert({
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
        ),
      );
      enrolled++;
    }
    return { enrolled };
  },
);
