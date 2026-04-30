import { inngest } from "../client";
import { db } from "@/lib/db";
import { getMailProvider } from "@/lib/mail";
import { buildBrand } from "@/lib/mail/brand";
import { newsletterEmail } from "@/lib/mail/templates";
import { blocksToEmailHtml, blocksToPlainText } from "@/lib/blocks/toEmail";
import { sanitizeHtml } from "@/lib/blocks/sanitize";

/**
 * Walks ACTIVE CampaignEnrollments whose nextSendAt is due, dispatches
 * the step at currentStep, then advances the cursor (or completes).
 */
export const campaignStepRunner = inngest.createFunction(
  { id: "campaign-step-runner" },
  { cron: "*/5 * * * *" },
  async ({ step }) => {
    const due = await step.run("find-due", () =>
      db.campaignEnrollment.findMany({
        where: {
          status: "ACTIVE",
          nextSendAt: { lte: new Date() },
        },
        include: {
          campaign: { include: { emails: { orderBy: { stepOrder: "asc" } } } },
          subscriber: {
            select: { id: true, email: true, unsubToken: true, status: true },
          },
        },
        take: 200,
      }),
    );

    if (due.length === 0) return { processed: 0 };

    const provider = getMailProvider();
    let processed = 0;

    for (const e of due) {
      await step.run(`send-${e.id}`, async () => {
        if (e.subscriber.status !== "ACTIVE") {
          await db.campaignEnrollment.update({
            where: { id: e.id },
            data: { status: "CANCELED", completedAt: new Date() },
          });
          return;
        }
        const emailStep = e.campaign.emails[e.currentStep];
        if (!emailStep) {
          await db.campaignEnrollment.update({
            where: { id: e.id },
            data: { status: "COMPLETED", completedAt: new Date(), nextSendAt: null },
          });
          return;
        }

        const brand = await buildBrand();
        const unsubUrl = `${brand.siteUrl}/newsletter/unsubscribe/${e.subscriber.unsubToken}`;
        const html = sanitizeHtml(blocksToEmailHtml(emailStep.content as unknown));
        const text = blocksToPlainText(emailStep.content as unknown);
        const mail = newsletterEmail({
          brand,
          subject: emailStep.subject,
          preheader: emailStep.preheader ?? "",
          bodyHtml: html,
          bodyText: text,
          unsubUrl,
        });

        try {
          await provider.send({
            to: e.subscriber.email,
            subject: mail.subject,
            html: mail.html,
            text: mail.text,
            metadata: {
              type: "drip",
              campaignId: e.campaignId,
              enrollmentId: e.id,
              stepOrder: String(emailStep.stepOrder),
              subscriberId: e.subscriber.id,
            },
          });
          const nextStep = e.currentStep + 1;
          const nextStepDef = e.campaign.emails[nextStep];
          if (!nextStepDef) {
            await db.campaignEnrollment.update({
              where: { id: e.id },
              data: {
                status: "COMPLETED",
                completedAt: new Date(),
                nextSendAt: null,
                currentStep: nextStep,
              },
            });
          } else {
            const next = new Date(Date.now() + nextStepDef.delayMinutes * 60_000);
            await db.campaignEnrollment.update({
              where: { id: e.id },
              data: { currentStep: nextStep, nextSendAt: next },
            });
          }
        } catch (err) {
          await db.campaignEnrollment.update({
            where: { id: e.id },
            data: { status: "FAILED", completedAt: new Date() },
          });
          void inngest
            .send({
              name: "deadletter/enqueue",
              data: {
                source: "campaign-step-runner",
                eventType: "drip-email",
                payload: { enrollmentId: e.id, step: emailStep.stepOrder } as never,
                error: err instanceof Error ? err.message : String(err),
              },
            })
            .catch(() => {});
        }
      });
      processed++;
    }

    return { processed };
  },
);
