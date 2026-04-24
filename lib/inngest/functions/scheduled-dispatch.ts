import { inngest } from "../client";
import { db } from "@/lib/db";

export const scheduledNewsletterDispatch = inngest.createFunction(
  { id: "scheduled-newsletter-dispatch" },
  { cron: "*/1 * * * *" },
  async ({ step }) => {
    const due = await step.run("find-due", () =>
      db.newsletter.findMany({
        where: {
          status: "SCHEDULED",
          scheduledAt: { lte: new Date() },
        },
        select: { id: true },
        take: 100,
      }),
    );

    if (due.length === 0) return { dispatched: 0 };

    await step.run("mark-sending", () =>
      db.newsletter.updateMany({
        where: { id: { in: due.map((n) => n.id) } },
        data: { status: "SENDING" },
      }),
    );

    for (const n of due) {
      void inngest
        .send({ name: "newsletter/send", data: { newsletterId: n.id } })
        .catch(() => {});
    }

    return { dispatched: due.length };
  },
);

export const scheduledEventNotificationDispatch = inngest.createFunction(
  { id: "scheduled-event-notification-dispatch" },
  { cron: "*/1 * * * *" },
  async ({ step }) => {
    const due = await step.run("find-due", () =>
      db.eventNotification.findMany({
        where: {
          status: { in: ["DRAFT", "SCHEDULED"] },
          sendAt: { lte: new Date() },
        },
        include: { event: { select: { id: true } } },
        take: 200,
      }),
    );

    if (due.length === 0) return { dispatched: 0 };

    await step.run("mark-sending", () =>
      db.eventNotification.updateMany({
        where: { id: { in: due.map((n) => n.id) } },
        data: { status: "SENDING" },
      }),
    );

    for (const n of due) {
      const name = n.type === "REMINDER" ? "event/reminder" : "event/announce";
      void inngest
        .send({
          name,
          data: { eventId: n.event.id, notificationId: n.id },
        })
        .catch(() => {});
    }

    return { dispatched: due.length };
  },
);
