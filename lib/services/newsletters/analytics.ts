import { db } from "@/lib/db";
import type { Actor } from "@/lib/tenant/context";
import { authorize } from "@/lib/rbac/authorize";

export type NewsletterAnalytics = {
  newsletterId: string;
  title: string;
  subject: string;
  sentAt: string | null;
  total: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
  complained: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
};

export async function getNewsletterAnalytics(
  actor: Actor,
  newsletterId: string,
): Promise<NewsletterAnalytics | null> {
  await authorize(actor, "newsletters.read", { type: "newsletter" });

  const newsletter = await db.newsletter.findUnique({
    where: { id: newsletterId },
    select: { id: true, title: true, subject: true, sentAt: true },
  });
  if (!newsletter) return null;

  const counts = await db.newsletterLog.groupBy({
    by: ["status"],
    where: { newsletterId },
    _count: { status: true },
  });

  const total = counts.reduce((sum, c) => sum + c._count.status, 0);
  const get = (s: string) => counts.find((c) => c.status === s)?._count.status ?? 0;

  const sent = get("SENT") + get("DELIVERED") + get("OPENED") + get("CLICKED");
  const delivered = get("DELIVERED") + get("OPENED") + get("CLICKED");
  const opened = get("OPENED") + get("CLICKED");
  const clicked = get("CLICKED");
  const bounced = get("BOUNCED");
  const failed = get("FAILED");
  const complained = get("COMPLAINED");

  const denominator = total || 1;

  return {
    newsletterId: newsletter.id,
    title: newsletter.title,
    subject: newsletter.subject,
    sentAt: newsletter.sentAt?.toISOString() ?? null,
    total,
    sent,
    delivered,
    opened,
    clicked,
    bounced,
    failed,
    complained,
    openRate: Math.round((opened / denominator) * 1000) / 10,
    clickRate: Math.round((clicked / denominator) * 1000) / 10,
    bounceRate: Math.round((bounced / denominator) * 1000) / 10,
  };
}

export async function listNewsletterAnalytics(actor: Actor) {
  await authorize(actor, "newsletters.read", { type: "newsletter" });

  const newsletters = await db.newsletter.findMany({
    where: { status: "SENT" },
    orderBy: { sentAt: "desc" },
    select: { id: true, title: true, subject: true, sentAt: true },
  });

  const results: NewsletterAnalytics[] = [];

  for (const nl of newsletters) {
    const counts = await db.newsletterLog.groupBy({
      by: ["status"],
      where: { newsletterId: nl.id },
      _count: { status: true },
    });

    const total = counts.reduce((sum, c) => sum + c._count.status, 0);
    const get = (s: string) => counts.find((c) => c.status === s)?._count.status ?? 0;

    const sent = get("SENT") + get("DELIVERED") + get("OPENED") + get("CLICKED");
    const delivered = get("DELIVERED") + get("OPENED") + get("CLICKED");
    const opened = get("OPENED") + get("CLICKED");
    const clicked = get("CLICKED");
    const bounced = get("BOUNCED");
    const failed = get("FAILED");
    const complained = get("COMPLAINED");
    const denominator = total || 1;

    results.push({
      newsletterId: nl.id,
      title: nl.title,
      subject: nl.subject,
      sentAt: nl.sentAt?.toISOString() ?? null,
      total,
      sent,
      delivered,
      opened,
      clicked,
      bounced,
      failed,
      complained,
      openRate: Math.round((opened / denominator) * 1000) / 10,
      clickRate: Math.round((clicked / denominator) * 1000) / 10,
      bounceRate: Math.round((bounced / denominator) * 1000) / 10,
    });
  }

  return results;
}
