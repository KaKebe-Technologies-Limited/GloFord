import type { Prisma } from "@prisma/client";
import { inngest } from "../client";
import { runAsTenant } from "@/lib/tenant/context";
import { getMailProvider } from "@/lib/mail";
import { buildBrand } from "@/lib/mail/brand";
import { eventNotificationEmail } from "@/lib/mail/templates";
import { blocksToEmailHtml, blocksToPlainText } from "@/lib/blocks/toEmail";

/**
 * Dispatch an event notification (announcement or reminder).
 *
 * Audience = ACTIVE subscribers in one of the event's segments (or all
 * ACTIVE subscribers if the event has no segments). Every DB write
 * runs inside runAsTenant(orgId, …) so RLS enforces isolation.
 */
const dispatcher = async ({
  event,
  step,
}: {
  event: { data: { orgId: string; eventId: string; notificationId: string } };
  step: { run: <T>(id: string, fn: () => Promise<T>) => Promise<T> };
}) => {
  const { orgId, eventId, notificationId } = event.data;

  const notif = await step.run("load-notification", () =>
    runAsTenant(orgId, async (tx) => {
      const n = await tx.eventNotification.findFirst({
        where: { id: notificationId, event: { organizationId: orgId, id: eventId } },
        include: { event: { include: { segments: { select: { id: true } } } } },
      });
      if (!n) throw new Error("notification not found");
      return n;
    }),
  );

  const brand = await step.run("load-brand", () => buildBrand(orgId));

  const audience = await step.run("resolve-audience", () =>
    runAsTenant(orgId, (tx) => {
      const segmentIds = notif.event.segments.map((s) => s.id);
      const where: Prisma.SubscriberWhereInput = {
        organizationId: orgId,
        status: "ACTIVE",
      };
      if (segmentIds.length > 0) {
        where.segments = { some: { segmentId: { in: segmentIds } } };
      }
      return tx.subscriber.findMany({
        where,
        select: { id: true, email: true, unsubToken: true },
      });
    }),
  );

  if (audience.length === 0) {
    await step.run("mark-sent-empty", () =>
      runAsTenant(orgId, (tx) =>
        tx.eventNotification.update({
          where: { id: notif.id },
          data: { status: "SENT", sentAt: new Date() },
        }),
      ),
    );
    return { sent: 0 };
  }

  const html = blocksToEmailHtml(notif.content as unknown);
  const text = blocksToPlainText(notif.content as unknown);
  const provider = getMailProvider();

  const CHUNK = 50;
  let sent = 0;
  for (let i = 0; i < audience.length; i += CHUNK) {
    const chunk = audience.slice(i, i + CHUNK);
    await step.run(`send-${i}`, async () => {
      for (const s of chunk) {
        const unsubUrl = `${brand.siteUrl}/newsletter/unsubscribe/${s.unsubToken}`;
        const eventUrl = `${brand.siteUrl}/events/${notif.event.slug}`;
        const mail = eventNotificationEmail({
          brand,
          subject: notif.subject,
          kind: notif.type,
          eventTitle: notif.event.title,
          eventStartsAt: notif.event.startsAt,
          eventLocation: notif.event.location ?? undefined,
          eventUrl,
          bodyHtml: html,
          bodyText: text,
          unsubUrl,
        });
        try {
          await provider.send({
            to: s.email,
            subject: mail.subject,
            html: mail.html,
            text: mail.text,
            metadata: {
              type: "event-notification",
              orgId,
              eventId,
              notificationId: notif.id,
              subscriberId: s.id,
              kind: notif.type,
            },
          });
          sent++;
        } catch {
          /* delivery errors are recorded by the provider's webhook; swallow here */
        }
      }
      return null;
    });
  }

  await step.run("mark-sent", () =>
    runAsTenant(orgId, (tx) =>
      tx.eventNotification.update({
        where: { id: notif.id },
        data: { status: "SENT", sentAt: new Date() },
      }),
    ),
  );

  return { sent, total: audience.length };
};

export const eventAnnounceSend = inngest.createFunction(
  { id: "event-announce-send", retries: 2, concurrency: { limit: 5 } },
  { event: "event/announce" },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ctx: any) => dispatcher(ctx),
);

export const eventReminderSend = inngest.createFunction(
  { id: "event-reminder-send", retries: 2, concurrency: { limit: 5 } },
  { event: "event/reminder" },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ctx: any) => dispatcher(ctx),
);
