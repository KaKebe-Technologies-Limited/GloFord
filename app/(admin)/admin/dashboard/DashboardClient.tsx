"use client";

import Link from "next/link";
import {
  FileText,
  Briefcase,
  Users,
  HandCoins,
  Mail,
  CalendarDays,
  ArrowRight,
  ArrowUpRight,
  Activity,
  PenTool,
  AlertTriangle,
  Zap,
  Heart,
  Shield,
  CreditCard,
  UserPlus,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { motion, type Variants } from "framer-motion";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  create: Zap,
  update: PenTool,
  delete: AlertTriangle,
  publish: ArrowUpRight,
  upload: FileText,
  refund: HandCoins,
};

function getActionIcon(action: string): React.ElementType {
  const key = Object.keys(ACTION_ICONS).find((k) =>
    action.toLowerCase().includes(k),
  );
  return key ? ACTION_ICONS[key]! : Activity;
}

function getActionColor(action: string): string {
  const a = action.toLowerCase();
  if (a.includes("delete") || a.includes("refund"))
    return "bg-[rgb(var(--token-danger)/0.10)] text-[var(--color-danger)]";
  if (a.includes("create") || a.includes("upload"))
    return "bg-[rgb(var(--token-success)/0.10)] text-[var(--color-success)]";
  if (a.includes("publish"))
    return "bg-[rgb(var(--token-primary)/0.10)] text-[var(--color-primary)]";
  return "bg-[var(--color-muted)] text-[var(--color-muted-fg)]";
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function DashboardClient({
  stats,
  recentAudit,
  userName,
}: {
  stats: {
    pagesPublished: number;
    pagesDraft: number;
    programsPublished: number;
    postsPublished: number;
    subscribersActive: number;
    subscribersPending: number;
    donationsAgg: { _sum: { amountCents: number | null }; _count: number };
    donations30: number;
    donationsTotalAgg: { _sum: { amountCents: number | null } };
    eventsUpcoming: number;
    newslettersDraft: number;
    newslettersSent: number;
    dlqPending: number;
  };
  recentAudit: Array<{
    id: string;
    action: string;
    entityType: string | null;
    createdAt: string;
    userId: string | null;
  }>;
  userName: string;
}) {
  const t = useTranslations("admin.dashboard");
  const fmt = new Intl.NumberFormat("en", { notation: "compact" });
  const currency = new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Header with greeting */}
      <header>
        <motion.h1
          variants={item}
          className="text-[22px] font-semibold tracking-[-0.02em] text-[var(--color-fg)]"
        >
          {getGreeting()}, {userName.split(" ")[0]}
        </motion.h1>
        <motion.p
          variants={item}
          className="mt-0.5 text-[13px] text-[var(--color-muted-fg)]"
        >
          {t("snapshot")}
        </motion.p>
      </header>

      {/* KPI Grid */}
      <motion.section
        variants={container}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      >
        <KpiCard
          variants={item}
          icon={FileText}
          label={t("kpi.pages")}
          value={fmt.format(stats.pagesPublished)}
          sub={t("kpi.pagesSub", { count: stats.pagesDraft })}
          href="/admin/pages"
        />
        <KpiCard
          variants={item}
          icon={Briefcase}
          label={t("kpi.programs")}
          value={fmt.format(stats.programsPublished)}
          sub={t("kpi.programsSub")}
          href="/admin/programs"
        />
        <KpiCard
          variants={item}
          icon={PenTool}
          label={t("kpi.posts")}
          value={fmt.format(stats.postsPublished)}
          sub={t("kpi.postsSub")}
          href="/admin/posts"
        />
        <KpiCard
          variants={item}
          icon={Users}
          label={t("kpi.subscribers")}
          value={fmt.format(stats.subscribersActive)}
          sub={t("kpi.subscribersSub", { count: stats.subscribersPending })}
          href="/admin/subscribers"
          accent
        />
        <KpiCard
          variants={item}
          icon={HandCoins}
          label={t("kpi.donations30")}
          value={currency.format(
            (stats.donationsAgg._sum.amountCents ?? 0) / 100,
          )}
          sub={t("kpi.donations30Sub", {
            successful: stats.donationsAgg._count,
            attempted: stats.donations30,
          })}
          href="/admin/donations"
          accent
        />
        <KpiCard
          variants={item}
          icon={Heart}
          label={t("kpi.donationsTotal")}
          value={currency.format(
            (stats.donationsTotalAgg._sum.amountCents ?? 0) / 100,
          )}
          sub={t("kpi.donationsTotalSub")}
          href="/admin/donations"
        />
        <KpiCard
          variants={item}
          icon={CalendarDays}
          label={t("kpi.events")}
          value={fmt.format(stats.eventsUpcoming)}
          sub={t("kpi.eventsSub")}
          href="/admin/events"
        />
        <KpiCard
          variants={item}
          icon={Mail}
          label={t("kpi.newsletters")}
          value={fmt.format(stats.newslettersSent)}
          sub={t("kpi.newslettersSub", { count: stats.newslettersDraft })}
          href="/admin/newsletters"
        />
      </motion.section>

      {/* Lower grid */}
      <section className="grid gap-4 lg:grid-cols-3">
        {/* Activity Feed */}
        <motion.div
          variants={item}
          className="lg:col-span-2 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]"
        >
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
            <div className="flex items-center gap-2">
              <Activity
                className="h-4 w-4 text-[var(--color-muted-fg)]"
                aria-hidden="true"
              />
              <h2 className="text-[13px] font-semibold text-[var(--color-fg)]">
                {t("recentActivity.title")}
              </h2>
            </div>
            <Link
              href="/admin/system/audit"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-muted-fg)] transition hover:text-[var(--color-fg)]"
            >
              {t("recentActivity.viewAudit")}
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>

          {recentAudit.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-muted)]">
                <Activity className="h-5 w-5 text-[var(--color-muted-fg)]" />
              </div>
              <p className="mt-3 text-[13px] text-[var(--color-muted-fg)]">
                {t("recentActivity.empty")}
              </p>
            </div>
          ) : (
            <ul>
              {recentAudit.map((r) => {
                const ActionIcon = getActionIcon(r.action);
                return (
                  <li
                    key={r.id}
                    className="group flex items-center gap-3 border-b border-[var(--color-border)] px-5 py-3 last:border-0 transition-colors hover:bg-[rgb(var(--token-muted)/0.30)]"
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${getActionColor(r.action)}`}
                    >
                      <ActionIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-[var(--color-fg)]">
                        {r.action}
                        {r.entityType && (
                          <span className="ml-1.5 font-normal text-[var(--color-muted-fg)]">
                            {t("recentActivity.onEntity", {
                              type: r.entityType,
                            })}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] tabular-nums text-[var(--color-muted-fg)]">
                      {relativeTime(r.createdAt)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </motion.div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Dead-letter queue */}
          <motion.div
            variants={item}
            className={`rounded-[var(--radius-lg)] border bg-[var(--color-card)] p-5 ${
              stats.dlqPending > 0
                ? "border-[rgb(var(--token-danger)/0.30)]"
                : "border-[var(--color-border)]"
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle
                className={`h-4 w-4 ${stats.dlqPending > 0 ? "text-[var(--color-danger)]" : "text-[var(--color-muted-fg)]"}`}
              />
              <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted-fg)]">
                {t("deadLetter.title")}
              </p>
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-fg)]">
              {fmt.format(stats.dlqPending)}
            </p>
            <p className="mt-1 text-[12px] text-[var(--color-muted-fg)]">
              {stats.dlqPending === 0
                ? t("deadLetter.zero")
                : t("deadLetter.pending")}
            </p>
            {stats.dlqPending > 0 && (
              <Link
                href="/admin/system/dead-letter"
                className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-[var(--color-danger)] transition hover:underline"
              >
                {t("deadLetter.action")}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            )}
          </motion.div>

          {/* Quick links */}
          <motion.div
            variants={item}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5"
          >
            <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted-fg)]">
              {t("quickLinks.title")}
            </p>
            <ul className="mt-3 space-y-1">
              <QuickLink
                href="/admin/system/health"
                icon={Shield}
                label={t("quickLinks.health")}
              />
              <QuickLink
                href="/admin/settings/payments"
                icon={CreditCard}
                label={t("quickLinks.payments")}
              />
              <QuickLink
                href="/admin/users"
                icon={UserPlus}
                label={t("quickLinks.users")}
              />
            </ul>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}

/* ─── KPI Card ─── */
function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  href,
  variants,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  href: string;
  variants?: Variants;
  accent?: boolean;
}) {
  return (
    <motion.div variants={variants}>
      <Link
        href={href}
        className="group relative block overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 transition-all duration-200 hover:border-[rgb(var(--token-primary)/0.25)] hover:shadow-[0_2px_12px_rgb(var(--token-primary)/0.06)]"
      >
        {/* Subtle top-edge accent for featured cards */}
        {accent && (
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]" />
        )}
        <div className="flex items-center gap-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[rgb(var(--token-primary)/0.08)]">
            <Icon
              className="h-3.5 w-3.5 text-[var(--color-primary)]"
              aria-hidden="true"
              strokeWidth={2}
            />
          </div>
          <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--color-muted-fg)]">
            {label}
          </span>
        </div>
        <p className="mt-2.5 text-2xl font-semibold tracking-tight text-[var(--color-fg)]">
          {value}
        </p>
        <p className="mt-0.5 text-[11px] text-[var(--color-muted-fg)]">
          {sub}
        </p>
        {/* Hover arrow */}
        <ArrowUpRight className="absolute right-3 top-3 h-3.5 w-3.5 text-[var(--color-muted-fg)] opacity-0 transition-opacity group-hover:opacity-100" />
      </Link>
    </motion.div>
  );
}

/* ─── Quick Link ─── */
function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-2.5 rounded-md px-2 py-2 text-[13px] text-[var(--color-fg)] transition-colors hover:bg-[var(--color-muted)]"
      >
        <Icon
          className="h-[15px] w-[15px] text-[var(--color-muted-fg)]"
          strokeWidth={1.75}
        />
        {label}
      </Link>
    </li>
  );
}
