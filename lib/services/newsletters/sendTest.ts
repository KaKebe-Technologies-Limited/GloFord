import { db } from "@/lib/db";
import { getMailProvider } from "@/lib/mail";
import { buildBrand } from "@/lib/mail/brand";
import { newsletterEmail } from "@/lib/mail/templates";
import { blocksToEmailHtml, blocksToPlainText } from "@/lib/blocks/toEmail";
import { sanitizeHtml } from "@/lib/blocks/sanitize";
import type { Actor } from "@/lib/tenant/context";
import { authorize } from "@/lib/rbac/authorize";

/**
 * Send a test/preview email of a newsletter to a single recipient (usually the current user).
 * Does NOT update newsletter status or create NewsletterLog entries.
 */
export async function sendNewsletterTest(
  actor: Actor,
  input: { newsletterId: string; recipientEmail: string },
) {
  await authorize(actor, "newsletters.send", { type: "newsletter" });

  const newsletter = await db.newsletter.findUnique({
    where: { id: input.newsletterId },
  });
  if (!newsletter) throw new Error("Newsletter not found");

  const brand = await buildBrand();
  const html = sanitizeHtml(blocksToEmailHtml(newsletter.content as unknown));
  const text = blocksToPlainText(newsletter.content as unknown);

  const mail = newsletterEmail({
    brand,
    subject: newsletter.subject,
    preheader: newsletter.preheader ?? "",
    bodyHtml: html,
    bodyText: text,
    unsubUrl: `${brand.siteUrl}/newsletter/unsubscribe/test-preview`,
  });

  const provider = getMailProvider();
  await provider.send({
    to: input.recipientEmail,
    subject: `[TEST] ${mail.subject}`,
    html: mail.html,
    text: mail.text,
    metadata: { type: "test", newsletterId: newsletter.id },
  });

  return { ok: true };
}
