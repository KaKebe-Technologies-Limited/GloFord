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
  Activity,
  PenTool,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { motion, type Variants } from "framer-motion";

export function DashboardClient({
  stats,
  recentAudit,
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
}) {
  const t = useTranslations("admin.dashboard");
  const fmt = new Intl.NumberFormat("en", { notation: "compact" });
  const currency = new Intl.NumberFormat("en", { style: "currency", currency: "USD" });

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <header>
        <motion.h1 variants={item} className="text-2xl font-semibold tracking-tight">
          {t("title")}
        </motion.h1>
        <motion.p variants={item} className="text-sm text-[var(--color-muted-fg)]">
          {t("snapshot")}
        </motion.p>
      </header>

      <motion.section variants={container} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <Kpi
          variants={item}
          icon={FileText}
          label={t("kpi.pages")}
          value={fmt.format(stats.pagesPublished)}
          sublabel={t("kpi.pagesSub", { count: stats.pagesDraft })}
          href="/admin/pages"
        />
        <Kpi
          variants={item}
          icon={Briefcase}
          label={t("kpi.programs")}
          value={fmt.format(stats.programsPublished)}
          sublabel={t("kpi.programsSub")}
          href="/admin/programs"
        />
        <Kpi
          variants={item}
          icon={PenTool}
          label={t("kpi.posts")}
          value={fmt.format(stats.postsPublished)}
          sublabel={t("kpi.postsSub")}
          href="/admin/posts"
        />
        <Kpi
          variants={item}
          icon={Users}
          label={t("kpi.subscribers")}
          value={fmt.format(stats.subscribersActive)}
          sublabel={t("kpi.subscribersSub", { count: stats.subscribersPending })}
          href="/admin/subscribers"
        />
        <Kpi
          variants={item}
          icon={HandCoins}
          label={t("kpi.donations30")}
          value={currency.format((stats.donationsAgg._sum.amountCents ?? 0) / 100)}
          sublabel={t("kpi.donations30Sub", {
            successful: stats.donationsAgg._count,
            attempted: stats.donations30,
          })}
          href="/admin/donations"
        />
        <Kpi
          variants={item}
          icon={HandCoins}
          label={t("kpi.donationsTotal")}
          value={currency.format((stats.donationsTotalAgg._sum.amountCents ?? 0) / 100)}
          sublabel={t("kpi.donationsTotalSub")}
          href="/admin/donations"
        />
        <Kpi
          variants={item}
          icon={CalendarDays}
          label={t("kpi.events")}
          value={fmt.format(stats.eventsUpcoming)}
          sublabel={t("kpi.eventsSub")}
          href="/admin/events"
        />
        <Kpi
          variants={item}
          icon={Mail}
          label={t("kpi.newsletters")}
          value={fmt.format(stats.newslettersSent)}
          sublabel={t("kpi.newslettersSub", { count: stats.newslettersDraft })}
          href="/admin/newsletters"
        />
      </motion.section>

      <section className="grid gap-6 lg:grid-cols-3">
        <motion.div variants={item} className="lg:col-span-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]">
          <header className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[var(--color-muted-fg)]" aria-hidden="true" />
              <h2 className="text-sm font-semibold">{t("recentActivity.title")}</h2>
            </div>
            <Link
              href="/admin/system/audit"
              className="inline-flex items-center gap-1 text-xs text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
            >
              {t("recentActivity.viewAudit")} <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </header>
          <ul className="divide-y divide-[var(--color-border)]">
            {recentAudit.length === 0 ? (
              <li className="px-5 py-6 text-sm text-[var(--color-muted-fg)]">
                {t("recentActivity.empty")}
              </li>
            ) : (
              recentAudit.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <span className="font-medium">{r.action}</span>
                  <span className="text-[var(--color-muted-fg)]">
                    {r.entityType ? t("recentActivity.onEntity", { type: r.entityType }) : ""}
                  </span>
                  <span className="ml-auto font-mono text-xs text-[var(--color-muted-fg)]">
                    {new Date(r.createdAt).toLocaleString()}
                  </span>
                </li>
              ))
            )}
          </ul>
        </motion.div>

        <div className="space-y-4">
          <motion.div variants={item} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
            <p className="text-xs uppercase tracking-wider text-[var(--color-muted-fg)]">
              {t("deadLetter.title")}
            </p>
            <p className="mt-2 text-3xl font-semibold">{fmt.format(stats.dlqPending)}</p>
            <p className="mt-1 text-xs text-[var(--color-muted-fg)]">
              {stats.dlqPending === 0 ? t("deadLetter.zero") : t("deadLetter.pending")}
            </p>
            {stats.dlqPending > 0 ? (
              <Link
                href="/admin/system/dead-letter"
                className="mt-3 inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline"
              >
                {t("deadLetter.action")} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            ) : null}
          </motion.div>

          <motion.div variants={item} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
            <p className="text-xs uppercase tracking-wider text-[var(--color-muted-fg)]">{t("quickLinks.title")}</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/admin/system/health" className="hover:underline">
                  → {t("quickLinks.health")}
                </Link>
              </li>
              <li>
                <Link href="/admin/settings/payments" className="hover:underline">
                  → {t("quickLinks.payments")}
                </Link>
              </li>
              <li>
                <Link href="/admin/users" className="hover:underline">
                  → {t("quickLinks.users")}
                </Link>
              </li>
            </ul>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  sublabel,
  href,
  variants,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sublabel: string;
  href: string;
  variants?: Variants;
}) {
  return (
    <motion.div variants={variants}>
      <Link
        href={href}
        className="group block rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 transition hover:shadow-sm"
      >
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--color-muted-fg)]">
          <Icon className="h-4 w-4" aria-hidden="true" />
          {label}
        </div>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
        <p className="mt-1 text-xs text-[var(--color-muted-fg)]">{sublabel}</p>
      </Link>
    </motion.div>
  );
}
