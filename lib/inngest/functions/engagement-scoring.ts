import { inngest } from "../client";
import { db } from "@/lib/db";

/**
 * Daily engagement scoring cron job.
 * Runs at 3 AM every day, recalculates engagement scores for all
 * ACTIVE subscribers based on opens/clicks in the last 30 days.
 *
 * Scoring:
 *   +10 per open (max 50)
 *   +15 per click (max 45)
 *   -5 per day since last engagement (min 0 total)
 *
 * Also auto-manages system segments:
 *   "Highly Engaged" (score >= 80)
 *   "At Risk" (score <= 20)
 */
export const engagementScoring = inngest.createFunction(
  { id: "engagement-scoring", retries: 1 },
  { cron: "0 3 * * *" },
  async ({ step }) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const subscribers = await step.run("load-subscribers", () =>
      db.subscriber.findMany({
        where: { status: "ACTIVE" },
        select: { id: true },
      }),
    );

    if (subscribers.length === 0) return { processed: 0 };

    // Ensure system segments exist
    const { highSegment, riskSegment } = await step.run("ensure-segments", async () => {
      const high = await db.segment.upsert({
        where: { slug: "highly-engaged" },
        update: {},
        create: {
          slug: "highly-engaged",
          name: "Highly Engaged",
          description: "Subscribers with engagement score >= 80",
          isSystem: true,
        },
      });
      const risk = await db.segment.upsert({
        where: { slug: "at-risk" },
        update: {},
        create: {
          slug: "at-risk",
          name: "At Risk",
          description: "Subscribers with engagement score <= 20",
          isSystem: true,
        },
      });
      return { highSegment: high, riskSegment: risk };
    });

    const BATCH = 100;
    let processed = 0;

    for (let i = 0; i < subscribers.length; i += BATCH) {
      const batch = subscribers.slice(i, i + BATCH);
      await step.run(`score-batch-${i}`, async () => {
        for (const sub of batch) {
          // Count opens and clicks in last 30 days
          const logs = await db.newsletterLog.findMany({
            where: {
              subscriberId: sub.id,
              createdAt: { gte: thirtyDaysAgo },
            },
            select: { openedAt: true, clickedAt: true },
          });

          const opens = logs.filter((l) => l.openedAt !== null).length;
          const clicks = logs.filter((l) => l.clickedAt !== null).length;

          // Determine last engagement date
          const engagementDates = logs
            .flatMap((l) => [l.openedAt, l.clickedAt])
            .filter(Boolean) as Date[];
          const lastEngaged = engagementDates.length > 0
            ? new Date(Math.max(...engagementDates.map((d) => d.getTime())))
            : null;

          // Calculate score
          const openPoints = Math.min(opens * 10, 50);
          const clickPoints = Math.min(clicks * 15, 45);
          const daysSinceEngagement = lastEngaged
            ? Math.floor((Date.now() - lastEngaged.getTime()) / (24 * 60 * 60 * 1000))
            : 30; // assume 30 days if never engaged
          const decayPoints = daysSinceEngagement * 5;

          const score = Math.max(0, Math.min(100, openPoints + clickPoints - decayPoints));

          // Update subscriber
          await db.subscriber.update({
            where: { id: sub.id },
            data: {
              engagementScore: score,
              ...(lastEngaged ? { lastEngagedAt: lastEngaged } : {}),
            },
          });

          // Manage segment membership
          if (score >= 80) {
            await db.subscriberSegment.upsert({
              where: { subscriberId_segmentId: { subscriberId: sub.id, segmentId: highSegment.id } },
              update: {},
              create: { subscriberId: sub.id, segmentId: highSegment.id, source: "AUTO" },
            });
            // Remove from at-risk if present
            await db.subscriberSegment.deleteMany({
              where: { subscriberId: sub.id, segmentId: riskSegment.id },
            });
          } else if (score <= 20) {
            await db.subscriberSegment.upsert({
              where: { subscriberId_segmentId: { subscriberId: sub.id, segmentId: riskSegment.id } },
              update: {},
              create: { subscriberId: sub.id, segmentId: riskSegment.id, source: "AUTO" },
            });
            // Remove from highly-engaged if present
            await db.subscriberSegment.deleteMany({
              where: { subscriberId: sub.id, segmentId: highSegment.id },
            });
          } else {
            // Remove from both system segments if score is in the middle
            await db.subscriberSegment.deleteMany({
              where: {
                subscriberId: sub.id,
                segmentId: { in: [highSegment.id, riskSegment.id] },
              },
            });
          }

          processed++;
        }
      });
    }

    return { processed };
  },
);
