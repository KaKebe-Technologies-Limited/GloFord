import Link from "next/link";
import {
  FileText,
  Newspaper,
  Users,
  HandCoins,
  Mail,
  CalendarDays,
  ArrowRight,
  Activity,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireActorFromSession } from "@/lib/auth-context";
import { runAsTenant } from "@/lib/tenant/context";
import { logger } from "@/lib/observability/log";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const t = await getTranslations("admin");
  const actor = await requireActorFromSession();
  const orgId = actor.orgId;

  const since = new Date();
  since.setDate(since.getDate() - 30);

  // Resilience: each KPI is its own promise — a single slow/failing
  // query must not blank the whole dashboard. settle() returns the
  // value if the promise resolved, otherwise a caller-supplied fallback
  // + a log line that shows up in observability.
  async function settle<T>(label: string, p: Promise<T>, fallback: T): Promise<T> {
    try {
      return await p;
    } catch (err) {
      void logger.error("dashboard.kpi.failed", {
        kpi: label,
        orgId,
        error: err instanceof Error ? err.message : String(err),
      });
      return fallback;
    }
  }

  const empty = { _sum: { amountCents: 0 }, _count: 0 };
  const emptyTotal = { _sum: { amountCents: 0 } };

  const {
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
  } = await runAsTenant(orgId, async (tx) => {
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
      settle("pagesPublished", tx.page.count({ where: { organizationId: orgId, status: "PUBLISHED" } }), 0),
      settle("pagesDraft", tx.page.count({ where: { organizationId: orgId, status: "DRAFT" } }), 0),
      settle("programsPublished", tx.program.count({ where: { organizationId: orgId, status: "PUBLISHED" } }), 0),
      settle("postsPublished", tx.post.count({ where: { organizationId: orgId, status: "PUBLISHED" } }), 0),
      settle("subscribersActive", tx.subscriber.count({ where: { organizationId: orgId, status: "ACTIVE" } }), 0),
      settle("subscribersPending", tx.subscriber.count({ where: { organizationId: orgId, status: "PENDING" } }), 0),
      settle(
        "donationsAgg",
        tx.donation.aggregate({
          where: { organizationId: orgId, status: "SUCCEEDED", createdAt: { gte: since } },
          _sum: { amountCents: true },
          _count: true,
        }),
        empty,
      ),
      settle(
        "donations30",
        tx.donation.count({ where: { organizationId: orgId, createdAt: { gte: since } } }),
        0,
      ),
      settle(
        "donationsTotalAgg",
        tx.donation.aggregate({
          where: { organizationId: orgId, status: "SUCCEEDED" },
          _sum: { amountCents: true },
        }),
        emptyTotal,
      ),
      settle(
        "eventsUpcoming",
        tx.event.count({ where: { organizationId: orgId, startsAt: { gte: new Date() } } }),
        0,
      ),
      settle("newslettersDraft", tx.newsletter.count({ where: { organizationId: orgId, status: "DRAFT" } }), 0),
      settle("newslettersSent", tx.newsletter.count({ where: { organizationId: orgId, status: "SENT" } }), 0),
      settle(
        "recentAudit",
        tx.auditLog.findMany({
          where: { organizationId: orgId },
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
      settle("dlqPending", tx.deadLetter.count({ where: { organizationId: orgId, status: "PENDING" } }), 0),
    ]);
    return {
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
    };
  });

  const fmt = new Intl.NumberFormat("en", { notation: "compact" });
  const currency = new Intl.NumberFormat("en", { style: "currency", currency: "USD" });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("dashboard")}</h1>
        <p className="text-sm text-[--color-muted-fg]">
          A snapshot of your organization&apos;s last 30 days.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <Kpi
          icon={FileText}
          label="Published pages"
          value={fmt.format(pagesPublished)}
          sublabel={`${pagesDraft} in draft`}
          href="/admin/pages"
        />
        <Kpi
          icon={Newspaper}
          label="Programs"
          value={fmt.format(programsPublished)}
          sublabel="Published"
          href="/admin/programs"
        />
        <Kpi
          icon={Newspaper}
          label="Posts"
          value={fmt.format(postsPublished)}
          sublabel="Published"
          href="/admin/posts"
        />
        <Kpi
          icon={Users}
          label="Active subscribers"
          value={fmt.format(subscribersActive)}
          sublabel={`${subscribersPending} pending confirm`}
          href="/admin/subscribers"
        />
        <Kpi
          icon={HandCoins}
          label="Donations — 30d"
          value={currency.format((donationsAgg._sum.amountCents ?? 0) / 100)}
          sublabel={`${donationsAgg._count} successful · ${donations30} attempted`}
          href="/admin/donations"
        />
        <Kpi
          icon={HandCoins}
          label="Donations — lifetime"
          value={currency.format((donationsTotalAgg._sum.amountCents ?? 0) / 100)}
          sublabel="Successful only"
          href="/admin/donations"
        />
        <Kpi
          icon={CalendarDays}
          label="Upcoming events"
          value={fmt.format(eventsUpcoming)}
          sublabel="Starting today or later"
          href="/admin/events"
        />
        <Kpi
          icon={Mail}
          label="Newsletters"
          value={fmt.format(newslettersSent)}
          sublabel={`${newslettersDraft} in draft`}
          href="/admin/newsletters"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-[--radius-lg] border border-[--color-border] bg-[--color-card]">
          <header className="flex items-center justify-between border-b border-[--color-border] px-5 py-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[--color-muted-fg]" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Recent activity</h2>
            </div>
            <Link
              href="/admin/system/audit"
              className="inline-flex items-center gap-1 text-xs text-[--color-muted-fg] hover:text-[--color-fg]"
            >
              Audit log <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </header>
          <ul className="divide-y divide-[--color-border]">
            {recentAudit.length === 0 ? (
              <li className="px-5 py-6 text-sm text-[--color-muted-fg]">
                No activity yet. Your first action will appear here.
              </li>
            ) : (
              recentAudit.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <span className="font-medium">{r.action}</span>
                  <span className="text-[--color-muted-fg]">
                    {r.entityType ? `on ${r.entityType}` : ""}
                  </span>
                  <span className="ml-auto font-mono text-xs text-[--color-muted-fg]">
                    {r.createdAt.toLocaleString()}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] p-5">
            <p className="text-xs uppercase tracking-wider text-[--color-muted-fg]">
              Dead-letter queue
            </p>
            <p className="mt-2 text-3xl font-semibold">{fmt.format(dlqPending)}</p>
            <p className="mt-1 text-xs text-[--color-muted-fg]">
              {dlqPending === 0 ? "Inbox zero" : "events waiting for review"}
            </p>
            {dlqPending > 0 ? (
              <Link
                href="/admin/system/dead-letter"
                className="mt-3 inline-flex items-center gap-1 text-sm text-[--color-primary] hover:underline"
              >
                Review now <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            ) : null}
          </div>

          <div className="rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] p-5">
            <p className="text-xs uppercase tracking-wider text-[--color-muted-fg]">Quick links</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/admin/system/health" className="hover:underline">
                  → System health
                </Link>
              </li>
              <li>
                <Link href="/admin/settings/payments" className="hover:underline">
                  → Payment providers
                </Link>
              </li>
              <li>
                <Link href="/admin/users" className="hover:underline">
                  → Invite users
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  sublabel,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sublabel: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] p-5 transition hover:shadow-sm"
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[--color-muted-fg]">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-[--color-muted-fg]">{sublabel}</p>
    </Link>
  );
}
