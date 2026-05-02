import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/observability/log";
import { DashboardClient } from "./DashboardClient";

export const metadata = { title: "Dashboard" };

interface AggResult {
  _sum: { amountCents: number | null };
  _count: number;
}

interface TotalAggResult {
  _sum: { amountCents: number | null };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userName = session.user.name ?? session.user.email ?? "Admin";

  const since = new Date();
  since.setDate(since.getDate() - 30);

  async function settle<T>(label: string, p: Promise<T>, fallback: T): Promise<T> {
    try {
      return await p;
    } catch (err) {
      void logger.error("dashboard.kpi.failed", {
        kpi: label,
        error: err instanceof Error ? err.message : String(err),
      });
      return fallback;
    }
  }

  const empty: AggResult = { _sum: { amountCents: 0 }, _count: 0 };
  const emptyTotal: TotalAggResult = { _sum: { amountCents: 0 } };

  const [
    pagesPublished,
    pagesDraft,
    programsPublished,
    postsPublished,
    subscribersActive,
    subscribersPending,
    donationsAgg,
    donations30,
    donationsTotalAgg,
    eventsUpcoming,
    newslettersDraft,
    newslettersSent,
    recentAudit,
    dlqPending,
  ] = await Promise.all([
    settle("pagesPublished", db.page.count({ where: { status: "PUBLISHED" } }), 0),
    settle("pagesDraft", db.page.count({ where: { status: "DRAFT" } }), 0),
    settle("programsPublished", db.program.count({ where: { status: "PUBLISHED" } }), 0),
    settle("postsPublished", db.post.count({ where: { status: "PUBLISHED" } }), 0),
    settle("subscribersActive", db.subscriber.count({ where: { status: "ACTIVE" } }), 0),
    settle("subscribersPending", db.subscriber.count({ where: { status: "PENDING" } }), 0),
    settle(
      "donationsAgg",
      db.donation.aggregate({
        where: { status: "SUCCEEDED", createdAt: { gte: since } },
        _sum: { amountCents: true },
        _count: true,
      }) as Promise<AggResult>,
      empty,
    ),
    settle("donations30", db.donation.count({ where: { createdAt: { gte: since } } }), 0),
    settle(
      "donationsTotalAgg",
      db.donation.aggregate({
        where: { status: "SUCCEEDED" },
        _sum: { amountCents: true },
      }) as Promise<TotalAggResult>,
      emptyTotal,
    ),
    settle("eventsUpcoming", db.event.count({ where: { startsAt: { gte: new Date() } } }), 0),
    settle("newslettersDraft", db.newsletter.count({ where: { status: "DRAFT" } }), 0),
    settle("newslettersSent", db.newsletter.count({ where: { status: "SENT" } }), 0),
    settle(
      "recentAudit",
      db.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          action: true,
          entityType: true,
          createdAt: true,
          userId: true,
        },
      }),
      [] as Array<{
        id: string;
        action: string;
        entityType: string | null;
        createdAt: Date;
        userId: string | null;
      }>,
    ),
    settle("dlqPending", db.deadLetter.count({ where: { status: "PENDING" } }), 0),
  ]);

  const stats = {
    pagesPublished,
    pagesDraft,
    programsPublished,
    postsPublished,
    subscribersActive,
    subscribersPending,
    donationsAgg,
    donations30,
    donationsTotalAgg,
    eventsUpcoming,
    newslettersDraft,
    newslettersSent,
    dlqPending,
  };

  const serializedAudit = recentAudit.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return <DashboardClient stats={stats} recentAudit={serializedAudit} userName={userName} />;
}
