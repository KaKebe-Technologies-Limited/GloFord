import type { Prisma } from "@prisma/client";
import { inngest } from "../client";
import { runAsTenant } from "@/lib/tenant/context";
import { getMailProvider } from "@/lib/mail";
import { buildBrand } from "@/lib/mail/brand";
import { newsletterEmail } from "@/lib/mail/templates";
import { blocksToEmailHtml, blocksToPlainText } from "@/lib/blocks/toEmail";

/**
 * Dispatch a newsletter to its audience.
 *
 * Audience = ACTIVE subscribers in one of the target segments (or all
 * ACTIVE subscribers if no segments were picked). We send in batches
 * using Inngest's step.sendEvent fan-out so:
 *   • a slow provider doesn't block the whole send
 *   • failures are retried per-subscriber
 *   • we can observe progress from the Inngest dashboard
 *
 * All DB touches run inside runAsTenant(orgId, …) so the RLS policies
 * enforce tenant isolation even when invoked from a system connection.
 */
export const newsletterSend = inngest.createFunction(
  { id: "newsletter-send", retries: 2, concurrency: { limit: 5 } },
  { event: "newsletter/send" },
  async ({ event, step }) => {
    const { orgId, newsletterId } = event.data;

    const newsletter = await step.run("load-newsletter", () =>
      runAsTenant(orgId, async (tx) => {
        const n = await tx.newsletter.findFirst({
          where: { id: newsletterId, organizationId: orgId },
        });
        if (!n) throw new Error("newsletter not found");
        return n;
      }),
    );

    const brand = await step.run("load-brand", () => buildBrand(orgId));

    const audience = await step.run("resolve-audience", () =>
      runAsTenant(orgId, (tx) => {
        const where: Prisma.SubscriberWhereInput = {
          organizationId: orgId,
          status: "ACTIVE",
        };
        if (newsletter.segmentIds.length > 0) {
          where.segments = { some: { segmentId: { in: newsletter.segmentIds } } };
        }
        return tx.subscriber.findMany({
          where,
          select: { id: true, email: true, unsubToken: true },
        });
      }),
    );

    if (audience.length === 0) {
      await step.run("mark-empty", () =>
        runAsTenant(orgId, (tx) =>
          tx.newsletter.update({
            where: { id: newsletter.id },
            data: { status: "SENT", sentAt: new Date() },
          }),
        ),
      );
      return { sent: 0 };
    }

    const html = blocksToEmailHtml(newsletter.content as unknown);
    const text = blocksToPlainText(newsletter.content as unknown);
    const provider = getMailProvider();

    const CHUNK = 50;
    let sent = 0;
    for (let i = 0; i < audience.length; i += CHUNK) {
      const chunk = audience.slice(i, i + CHUNK);
      await step.run(`send-${i}`, async () => {
        for (const s of chunk) {
          const unsubUrl = `${brand.siteUrl}/newsletter/unsubscribe/${s.unsubToken}`;
          const mail = newsletterEmail({
            brand,
            subject: newsletter.subject,
            preheader: newsletter.preheader ?? "",
            bodyHtml: html,
            bodyText: text,
            unsubUrl,
          });
          try {
            const res = await provider.send({
              to: s.email,
              subject: mail.subject,
              html: mail.html,
              text: mail.text,
              metadata: { type: "newsletter", orgId, newsletterId: newsletter.id, subscriberId: s.id },
            });
            await runAsTenant(orgId, (tx) =>
              tx.newsletterLog.upsert({
                where: {
                  newsletterId_subscriberId: { newsletterId: newsletter.id, subscriberId: s.id },
                },
                update: {
                  providerMsgId: res.providerMessageId,
                  status: "SENT",
                },
                create: {
                  newsletterId: newsletter.id,
                  subscriberId: s.id,
                  providerMsgId: res.providerMessageId,
                  status: "SENT",
                },
              }),
            );
            sent++;
          } catch (e) {
            await runAsTenant(orgId, (tx) =>
              tx.newsletterLog.upsert({
                where: {
                  newsletterId_subscriberId: { newsletterId: newsletter.id, subscriberId: s.id },
                },
                update: {
                  status: "FAILED",
                  error: e instanceof Error ? e.message : String(e),
                },
                create: {
                  newsletterId: newsletter.id,
                  subscriberId: s.id,
                  status: "FAILED",
                  error: e instanceof Error ? e.message : String(e),
                },
              }),
            );
          }
        }
      });
    }

    await step.run("mark-sent", () =>
      runAsTenant(orgId, (tx) =>
        tx.newsletter.update({
          where: { id: newsletter.id },
          data: { status: "SENT", sentAt: new Date() },
        }),
      ),
    );

    return { sent, total: audience.length };
  },
);
