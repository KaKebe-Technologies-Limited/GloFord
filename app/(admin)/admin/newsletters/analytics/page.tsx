import { requireActorFromSession } from "@/lib/auth-context";
import { listNewsletterAnalytics } from "@/lib/services/newsletters/analytics";
import Link from "next/link";
import { ArrowLeft, Mail, MousePointerClick, Eye, AlertTriangle } from "lucide-react";

export const metadata = { title: "Newsletter Analytics" };

export default async function NewsletterAnalyticsPage() {
  const actor = await requireActorFromSession();
  const data = await listNewsletterAnalytics(actor);

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Link
          href="/admin/newsletters"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-muted-fg)] hover:bg-[var(--color-muted)] hover:text-[var(--color-fg)]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Newsletter Analytics</h1>
          <p className="text-sm text-[var(--color-muted-fg)]">
            Delivery and engagement metrics for sent newsletters
          </p>
        </div>
      </header>

      {data.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)] p-12 text-center">
          <Mail className="mx-auto h-8 w-8 text-[var(--color-muted-fg)]" />
          <p className="mt-3 text-sm text-[var(--color-muted-fg)]">
            No newsletters have been sent yet. Analytics will appear here after your first send.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((nl) => (
            <div
              key={nl.newsletterId}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link
                    href={`/admin/newsletters/${nl.newsletterId}`}
                    className="text-sm font-semibold text-[var(--color-fg)] hover:underline"
                  >
                    {nl.title}
                  </Link>
                  <p className="truncate text-xs text-[var(--color-muted-fg)]">{nl.subject}</p>
                  {nl.sentAt && (
                    <p className="mt-1 text-[11px] text-[var(--color-muted-fg)]">
                      Sent {new Date(nl.sentAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-[var(--color-muted)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-muted-fg)]">
                  {nl.total} recipients
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MetricCard
                  icon={Mail}
                  label="Delivered"
                  value={nl.delivered}
                  total={nl.total}
                  percentage={nl.total ? Math.round((nl.delivered / nl.total) * 100) : 0}
                />
                <MetricCard
                  icon={Eye}
                  label="Opened"
                  value={nl.opened}
                  total={nl.total}
                  percentage={nl.openRate}
                  accent
                />
                <MetricCard
                  icon={MousePointerClick}
                  label="Clicked"
                  value={nl.clicked}
                  total={nl.total}
                  percentage={nl.clickRate}
                  accent
                />
                <MetricCard
                  icon={AlertTriangle}
                  label="Bounced"
                  value={nl.bounced}
                  total={nl.total}
                  percentage={nl.bounceRate}
                  danger={nl.bounceRate > 5}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  total,
  percentage,
  accent,
  danger,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  total: number;
  percentage: number;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
      <div className="flex items-center gap-1.5">
        <Icon
          className={`h-3.5 w-3.5 ${
            danger
              ? "text-[var(--color-danger)]"
              : accent
                ? "text-[var(--color-primary)]"
                : "text-[var(--color-muted-fg)]"
          }`}
          strokeWidth={2}
        />
        <span className="text-[11px] font-medium text-[var(--color-muted-fg)]">{label}</span>
      </div>
      <p className="mt-1.5 text-lg font-semibold text-[var(--color-fg)]">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--color-muted)]">
          <div
            className={`h-full rounded-full ${
              danger ? "bg-[var(--color-danger)]" : "bg-[var(--color-primary)]"
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <span className="text-[11px] tabular-nums text-[var(--color-muted-fg)]">
          {percentage}%
        </span>
      </div>
    </div>
  );
}
