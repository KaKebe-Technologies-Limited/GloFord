import { inngest } from "../client";
import { db } from "@/lib/db";
import { getMailProvider } from "@/lib/mail";
import { buildBrand } from "@/lib/mail/brand";
import { eventNotificationEmail } from "@/lib/mail/templates";

/**
 * Auto-reminder: runs every 15 minutes, finds events starting in the next
 * 24 hours that have registered attendees who haven't been reminded yet.
 * Sends a personalized reminder email to each registrant.
 */
export const eventAutoReminder = inngest.createFunction(
  { id: "event-auto-reminder", retries: 2 },
  { cron: "*/15 * * * *" },
  async ({ step }) => {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find events starting in next 24h that haven't had auto-reminders sent
    const events = await step.run("find-upcoming-events", () =>
      db.event.findMany({
        where: {
          startsAt: { gte: now, lte: in24h },
          isPublic: true,
          // Only events that don't have a SENT reminder notification marked as auto
          notifications: {
            none: {
              type: "REMINDER",
              status: "SENT",
              subject: { startsWith: "[auto]" },
            },
          },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          startsAt: true,
          location: true,
          registrations: {
            where: { status: "GOING" },
            select: { email: true, name: true },
          },
        },
      }),
    );

    if (events.length === 0) return { reminded: 0 };

    const brand = await step.run("load-brand", () => buildBrand());
    const provider = getMailProvider();
    let totalSent = 0;

    for (const event of events) {
      if (event.registrations.length === 0) continue;

      await step.run(`remind-${event.id}`, async () => {
        for (const reg of event.registrations) {
          const startsAtDate = new Date(event.startsAt);
          const mail = eventNotificationEmail({
            brand,
            subject: `Reminder: ${event.title} is tomorrow`,
            kind: "REMINDER",
            eventTitle: event.title,
            eventStartsAt: startsAtDate,
            eventLocation: event.location ?? undefined,
            eventUrl: `${brand.siteUrl}/events/${event.slug}`,
            bodyHtml: `<p>This is a friendly reminder that this event is starting soon. We look forward to seeing you there!</p>`,
            bodyText: `Reminder: ${event.title} starts ${startsAtDate.toISOString()}. ${event.location ? `Location: ${event.location}` : ""}`,
            unsubUrl: `${brand.siteUrl}/newsletter/unsubscribe/auto-reminder`,
          });

          try {
            await provider.send({
              to: reg.email,
              subject: mail.subject,
              html: mail.html,
              text: mail.text,
              metadata: { type: "event-auto-reminder", eventId: event.id },
            });
            totalSent++;
          } catch {
            // Individual send failure — don't block others
          }
        }

        // Mark as sent by creating a notification record
        await db.eventNotification.create({
          data: {
            eventId: event.id,
            type: "REMINDER",
            subject: `[auto] Reminder for ${event.title}`,
            content: [],
            sendAt: now,
            status: "SENT",
            sentAt: now,
          },
        });
      });
    }

    return { reminded: totalSent, events: events.length };
  },
);

