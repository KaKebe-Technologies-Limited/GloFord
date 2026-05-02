import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { requireActorFromSession } from "@/lib/auth-context";
import { listDeadLetters, countPendingDeadLetters } from "@/lib/services/system";
import { DeadLetterRow } from "./DeadLetterRow";

export const metadata = { title: "Dead letter queue" };

type Status = "PENDING" | "RETRIED" | "RESOLVED" | "IGNORED";

export default async function DeadLetterPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; cursor?: string }>;
}) {
  const params = await searchParams;
  await requireActorFromSession();
  const normalized = ["PENDING", "RETRIED", "RESOLVED", "IGNORED"].includes(params.status ?? "")
    ? (params.status as Status)
    : undefined;

  const [{ items, nextCursor, hasMore }, pendingCount] = await Promise.all([
    listDeadLetters({ status: normalized, cursor: params.cursor || undefined }),
    countPendingDeadLetters(),
  ]);

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { ...params, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    return `/admin/system/dead-letter?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dead-letter queue</h1>
          <p className="text-sm text-[var(--color-muted-fg)]">
            Events that failed after retries. Inspect, retry, or dismiss.
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgb(239_180_0/0.10)] px-3 py-1 text-xs font-medium text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            {pendingCount} pending
          </span>
        )}
      </header>

      <form className="flex items-center gap-3">
        <label htmlFor="dl-status" className="text-sm font-medium">Status</label>
        <select
          id="dl-status"
          name="status"
          defaultValue={normalized ?? ""}
          className="rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm"
        >
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="RETRIED">Retried</option>
          <option value="RESOLVED">Resolved</option>
          <option value="IGNORED">Ignored</option>
        </select>
        <button
          type="submit"
          className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
        >
          Filter
        </button>
        {normalized && (
          <Link href="/admin/system/dead-letter" className="text-sm text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]">
            Clear
          </Link>
        )}
      </form>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[rgb(var(--token-muted)/0.50)] text-left text-xs uppercase tracking-wider text-[var(--color-muted-fg)]">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Error</th>
                <th className="px-4 py-3">Attempts</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 w-0">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[var(--color-muted-fg)]">
                    {normalized ? "No dead letters match this filter." : "Inbox zero \u2014 no dead letters."}
                  </td>
                </tr>
              ) : (
                items.map((r) => (
                  <DeadLetterRow
                    key={r.id}
                    row={{
                      id: r.id,
                      createdAt: r.createdAt.toLocaleString(),
                      source: r.source,
                      eventType: r.eventType,
                      error: r.error,
                      payload: r.payload as Record<string, unknown> | null,
                      attempts: r.attempts,
                      status: r.status,
                    }}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {hasMore && (
        <div className="flex justify-center">
          <Link
            href={buildUrl({ cursor: nextCursor })}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-muted)]"
          >
            Load more
          </Link>
        </div>
      )}
    </div>
  );
}
