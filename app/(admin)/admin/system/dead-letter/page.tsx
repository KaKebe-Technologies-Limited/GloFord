import { AlertTriangle } from "lucide-react";
import { requireActorFromSession } from "@/lib/auth-context";
import { listDeadLetters } from "@/lib/services/system";
import { DeadLetterRow } from "./DeadLetterRow";

export const metadata = { title: "Dead letter queue" };

type Status = "PENDING" | "RETRIED" | "RESOLVED" | "IGNORED";

export default async function DeadLetterPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const actor = await requireActorFromSession();
  const normalized = ["PENDING", "RETRIED", "RESOLVED", "IGNORED"].includes(status ?? "")
    ? (status as Status)
    : undefined;
  const rows = await listDeadLetters(actor.orgId, { status: normalized });

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dead-letter queue</h1>
          <p className="text-sm text-[--color-muted-fg]">
            Events that failed after retries. Inspect, retry, or dismiss.
          </p>
        </div>
        {rows.some((r) => r.status === "PENDING") ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[--color-warning]/10 px-3 py-1 text-xs font-medium text-[--color-warning]">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            {rows.filter((r) => r.status === "PENDING").length} pending
          </span>
        ) : null}
      </header>

      <form className="flex items-center gap-3">
        <label htmlFor="dl-status" className="text-sm font-medium">
          Status
        </label>
        <select
          id="dl-status"
          name="status"
          aria-label="Filter by status"
          defaultValue={normalized ?? ""}
          className="rounded-[--radius-md] border border-[--color-input] bg-[--color-bg] px-3 py-2 text-sm"
        >
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="RETRIED">Retried</option>
          <option value="RESOLVED">Resolved</option>
          <option value="IGNORED">Ignored</option>
        </select>
        <button
          type="submit"
          className="rounded-[--radius-md] border border-[--color-border] bg-[--color-card] px-3 py-2 text-sm hover:bg-[--color-muted]"
        >
          Filter
        </button>
      </form>

      <div className="overflow-hidden rounded-[--radius-lg] border border-[--color-border] bg-[--color-card]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[--color-border] bg-[--color-muted]/50 text-left text-xs uppercase tracking-wider text-[--color-muted-fg]">
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
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[--color-muted-fg]">
                    Inbox zero — no dead letters.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <DeadLetterRow
                    key={r.id}
                    row={{
                      id: r.id,
                      createdAt: r.createdAt.toLocaleString(),
                      source: r.source,
                      eventType: r.eventType,
                      error: r.error,
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
    </div>
  );
}
