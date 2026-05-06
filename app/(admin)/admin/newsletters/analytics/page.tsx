import { requireActorFromSession } from "@/lib/auth-context";
import { listNewsletterAnalytics } from "@/lib/services/newsletters/analytics";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Newsletter Analytics" };

export default async function NewsletterAnalyticsPage() {
  const actor = await requireActorFromSession();
  const allData = await listNewsletterAnalytics(actor);
  const data = allData.slice(0, 20);

  const totalSent = data.reduce((sum, nl) => sum + nl.sent, 0);
  const totalBounced = data.reduce((sum, nl) => sum + nl.bounced, 0);
  const avgOpenRate =
    data.length > 0
      ? Math.round((data.reduce((sum, nl) => sum + nl.openRate, 0) / data.length) * 10) / 10
      : 0;
  const avgClickRate =
    data.length > 0
      ? Math.round((data.reduce((sum, nl) => sum + nl.clickRate, 0) / data.length) * 10) / 10
      : 0;

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
            Delivery and engagement metrics for the last 20 newsletters
          </p>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard label="Total Sent" value={totalSent.toLocaleString()} />
        <SummaryCard label="Avg Open Rate" value={`${avgOpenRate}%`} variant="success" />
        <SummaryCard label="Avg Click Rate" value={`${avgClickRate}%`} variant="primary" />
        <SummaryCard label="Total Bounced" value={totalBounced.toLocaleString()} variant="danger" />
      </div>

      {/* Per-newsletter table */}
      {data.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)] p-12 text-center">
          <p className="text-sm text-[var(--color-muted-fg)]">
            No newsletters have been sent yet. Analytics will appear here after your first send.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)]">
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-muted-fg)]">Subject</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--color-muted-fg)]">Sent</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--color-muted-fg)]">Delivered</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--color-muted-fg)]">Opened</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--color-muted-fg)]">Clicked</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--color-muted-fg)]">Bounced</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--color-muted-fg)]">Open Rate</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--color-muted-fg)]">Click Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {data.map((nl) => (
                  <tr key={nl.newsletterId} className="hover:bg-[var(--color-muted)]/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/newsletters/${nl.newsletterId}`}
                        className="font-medium text-[var(--color-fg)] hover:text-[var(--color-primary)] hover:underline"
                      >
                        {nl.subject}
                      </Link>
                      {nl.sentAt && (
                        <p className="mt-0.5 text-xs text-[var(--color-muted-fg)]">
                          {new Date(nl.sentAt).toLocaleDateString("en", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{nl.sent}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{nl.delivered}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{nl.opened}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{nl.clicked}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className={nl.bounced > 0 ? "text-[var(--color-danger)]" : ""}>
                        {nl.bounced}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className="text-[var(--color-success)]">{nl.openRate}%</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className="text-[var(--color-primary)]">{nl.clickRate}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant?: "primary" | "success" | "danger";
}) {
  const valueColor =
    variant === "primary"
      ? "text-[var(--color-primary)]"
      : variant === "success"
        ? "text-[var(--color-success)]"
        : variant === "danger"
          ? "text-[var(--color-danger)]"
          : "text-[var(--color-fg)]";

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
      <p className="text-xs font-medium text-[var(--color-muted-fg)]">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tracking-tight ${valueColor}`}>{value}</p>
    </div>
  );
}
