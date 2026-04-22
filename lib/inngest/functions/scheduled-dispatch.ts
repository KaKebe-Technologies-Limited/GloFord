import { inngest } from "../client";
import { runAsSystem } from "@/lib/tenant/context";

/**
 * Every minute, picks up SCHEDULED newsletters whose scheduledAt has
 * passed and emits `newsletter/send` for each. The actual send logic
 * lives in newsletter-send.ts.
 *
 * Runs under runAsSystem because it scans across tenants.
 */
export const scheduledNewsletterDispatch = inngest.createFunction(
  { id: "scheduled-newsletter-dispatch" },
  { cron: "*/1 * * * *" },
  async ({ step }) => {
    const due = await step.run("find-due", () =>
      runAsSystem((tx) =>
        tx.newsletter.findMany({
          where: {
            status: "SCHEDULED",
            scheduledAt: { lte: new Date() },
          },
          select: { id: true, organizationId: true },
          take: 100,
        }),
      ),
    );

    if (due.length === 0) return { dispatched: 0 };

    await step.run("mark-sending", () =>
      runAsSystem((tx) =>
        tx.newsletter.updateMany({
          where: { id: { in: due.map((n) => n.id) } },
          data: { status: "SENDING" },
        }),
      ),
    );

    for (const n of due) {
      void inngest
        .send({
          name: "newsletter/send",
          data: { orgId: n.organizationId, newsletterId: n.id },
        })
        .catch(() => {});
    }

    return { dispatched: due.length };
  },
);

/**
 * Every minute, picks up event notifications (announcements and
 * reminders) whose sendAt has passed and emits the matching event.
 */
export const scheduledEventNotificationDispatch = inngest.createFunction(
  { id: "scheduled-event-notification-dispatch" },
  { cron: "*/1 * * * *" },
  async ({ step }) => {
    const due = await step.run("find-due", () =>
      runAsSystem((tx) =>
        tx.eventNotification.findMany({
          where: {
            status: { in: ["DRAFT", "SCHEDULED"] },
            sendAt: { lte: new Date() },
          },
          include: { event: { select: { organizationId: true, id: true } } },
          take: 200,
        }),
      ),
    );

    if (due.length === 0) return { dispatched: 0 };

    await step.run("mark-sending", () =>
      runAsSystem((tx) =>
        tx.eventNotification.updateMany({
          where: { id: { in: due.map((n) => n.id) } },
          data: { status: "SENDING" },
        }),
      ),
    );

    for (const n of due) {
      const name = n.type === "REMINDER" ? "event/reminder" : "event/announce";
      void inngest
        .send({
          name,
          data: {
            orgId: n.event.organizationId,
            eventId: n.event.id,
            notificationId: n.id,
          },
        })
        .catch(() => {});
    }

    return { dispatched: due.length };
  },
);
