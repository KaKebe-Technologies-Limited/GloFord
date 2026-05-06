import type { Prisma } from "@prisma/client";
import { inngest } from "../client";
import { db } from "@/lib/db";
import { getMailProvider } from "@/lib/mail";
import { buildBrand } from "@/lib/mail/brand";
import { newsletterEmail } from "@/lib/mail/templates";
import { blocksToEmailHtml, blocksToPlainText } from "@/lib/blocks/toEmail";
import { sanitizeHtml } from "@/lib/blocks/sanitize";

export const newsletterSend = inngest.createFunction(
  { id: "newsletter-send", retries: 2, concurrency: { limit: 5 } },
  { event: "newsletter/send" },
  async ({ event, step }) => {
    const { newsletterId } = event.data;

    const newsletter = await step.run("load-newsletter", async () => {
      const n = await db.newsletter.findUnique({ where: { id: newsletterId } });
      if (!n) throw new Error("newsletter not found");
      return n;
    });

    const brand = await step.run("load-brand", () => buildBrand());

    const audience = await step.run("resolve-audience", () => {
      const where: Prisma.SubscriberWhereInput = { status: "ACTIVE" };
      if (newsletter.segmentIds.length > 0) {
        where.segments = { some: { segmentId: { in: newsletter.segmentIds } } };
      }
      return db.subscriber.findMany({
        where,
        select: { id: true, email: true, unsubToken: true, preferences: true },
      });
    });

    // Filter out subscribers who opted out of newsletters
    const eligible = audience.filter((s) => {
      const prefs = s.preferences as Record<string, unknown> | null;
      return !prefs || prefs.newsletters !== false;
    });

    if (eligible.length === 0) {
      await step.run("mark-empty", () =>
        db.newsletter.update({
          where: { id: newsletter.id },
          data: { status: "SENT", sentAt: new Date() },
        }),
      );
      return { sent: 0 };
    }

    // ─── A/B split logic ─────────────────────────────────────────
    const isABTest = !!newsletter.subjectB;
    const abPercent = newsletter.abTestPercent ?? 20;

    // Shuffle eligible array to randomize split
    const shuffled = [...eligible].sort(() => Math.random() - 0.5);
    const splitIndex = isABTest
      ? Math.max(1, Math.round((shuffled.length * abPercent) / 100))
      : 0;

    // Variant B gets the first `splitIndex` subscribers, variant A gets the rest
    const variantBSubs = isABTest ? shuffled.slice(0, splitIndex) : [];
    const variantASubs = isABTest ? shuffled.slice(splitIndex) : shuffled;

    const html = sanitizeHtml(blocksToEmailHtml(newsletter.content as unknown));
    const text = blocksToPlainText(newsletter.content as unknown);
    const provider = getMailProvider();

    async function sendChunk(
      chunk: typeof eligible,
      subject: string,
      variant: "A" | "B",
      startIdx: number,
    ) {
      for (const s of chunk) {
        const unsubUrl = `${brand.siteUrl}/newsletter/unsubscribe/${s.unsubToken}`;
        const prefsUrl = `${brand.siteUrl}/newsletter/preferences/${s.unsubToken}`;
        const mail = newsletterEmail({
          brand,
          subject,
          preheader: newsletter.preheader ?? "",
          bodyHtml: html,
          bodyText: text,
          unsubUrl,
          prefsUrl,
        });
        try {
          const res = await provider.send({
            to: s.email,
            subject: mail.subject,
            html: mail.html,
            text: mail.text,
            metadata: { type: "newsletter", newsletterId: newsletter.id, subscriberId: s.id },
          });
          await db.newsletterLog.upsert({
            where: {
              newsletterId_subscriberId: { newsletterId: newsletter.id, subscriberId: s.id },
            },
            update: {
              providerMsgId: res.providerMessageId,
              status: "SENT",
              metadata: isABTest ? { variant } : undefined,
            },
            create: {
              newsletterId: newsletter.id,
              subscriberId: s.id,
              providerMsgId: res.providerMessageId,
              status: "SENT",
              metadata: isABTest ? { variant } : undefined,
            },
          });
          sent++;
        } catch (e) {
          await db.newsletterLog.upsert({
            where: {
              newsletterId_subscriberId: { newsletterId: newsletter.id, subscriberId: s.id },
            },
            update: {
              status: "FAILED",
              error: e instanceof Error ? e.message : String(e),
              metadata: isABTest ? { variant } : undefined,
            },
            create: {
              newsletterId: newsletter.id,
              subscriberId: s.id,
              status: "FAILED",
              error: e instanceof Error ? e.message : String(e),
              metadata: isABTest ? { variant } : undefined,
            },
          });
        }
      }
    }

    const CHUNK = 50;
    let sent = 0;

    // Send variant A
    for (let i = 0, chunkIndex = 0; i < variantASubs.length; i += CHUNK, chunkIndex++) {
      if (chunkIndex > 0) {
        await step.sleep(`rate-limit-a-${chunkIndex}`, "5s");
      }
      const chunk = variantASubs.slice(i, i + CHUNK);
      await step.run(`send-a-${i}`, () => sendChunk(chunk, newsletter.subject, "A", i));
    }

    // Send variant B (only if A/B test)
    if (isABTest && variantBSubs.length > 0) {
      for (let i = 0, chunkIndex = 0; i < variantBSubs.length; i += CHUNK, chunkIndex++) {
        if (chunkIndex > 0) {
          await step.sleep(`rate-limit-b-${chunkIndex}`, "5s");
        }
        const chunk = variantBSubs.slice(i, i + CHUNK);
        await step.run(`send-b-${i}`, () => sendChunk(chunk, newsletter.subjectB!, "B", i));
      }
    }

    await step.run("mark-sent", () =>
      db.newsletter.update({
        where: { id: newsletter.id },
        data: { status: "SENT", sentAt: new Date() },
      }),
    );

    return {
      sent,
      total: eligible.length,
      skippedByPrefs: audience.length - eligible.length,
      ...(isABTest ? { variantA: variantASubs.length, variantB: variantBSubs.length } : {}),
    };
  },
);
