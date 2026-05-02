import Link from "next/link";
import { requireActorFromSession } from "@/lib/auth-context";
import { listAuditLogs, listAuditModules, countAuditLogs } from "@/lib/services/system";

export const metadata = { title: "Audit log" };

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ module?: string; from?: string; to?: string; cursor?: string; action?: string }>;
}) {
  const params = await searchParams;
  await requireActorFromSession();

  const filter = {
    module: params.module || undefined,
    action: params.action || undefined,
    from: params.from || undefined,
    to: params.to || undefined,
    cursor: params.cursor || undefined,
  };

  const [{ items, nextCursor, hasMore }, modules, total] = await Promise.all([
    listAuditLogs(filter),
    listAuditModules(),
    countAuditLogs(filter),
  ]);

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { ...params, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    return `/admin/system/audit?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="text-sm text-[var(--color-muted-fg)]">
          {total.toLocaleString()} event{total !== 1 ? "s" : ""} total
        </p>
      </header>

      {/* Filters */}
      <form className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="audit-module" className="text-xs font-medium text-[var(--color-muted-fg)]">Module</label>
          <select
            id="audit-module"
            name="module"
            defaultValue={params.module ?? ""}
            className="rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {modules.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="audit-action" className="text-xs font-medium text-[var(--color-muted-fg)]">Action</label>
          <input
            id="audit-action"
            name="action"
            placeholder="e.g. create, delete"
            defaultValue={params.action ?? ""}
            className="w-36 rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="audit-from" className="text-xs font-medium text-[var(--color-muted-fg)]">From</label>
          <input
            id="audit-from"
            type="date"
            name="from"
            defaultValue={params.from ?? ""}
            className="rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="audit-to" className="text-xs font-medium text-[var(--color-muted-fg)]">To</label>
          <input
            id="audit-to"
            type="date"
            name="to"
            defaultValue={params.to ?? ""}
            className="rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
        >
          Filter
        </button>
        {(params.module || params.action || params.from || params.to) && (
          <Link href="/admin/system/audit" className="text-sm text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]">
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[rgb(var(--token-muted)/0.50)] text-left text-xs uppercase tracking-wider text-[var(--color-muted-fg)]">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3 w-0"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[var(--color-muted-fg)]">
                    No audit events match this filter.
                  </td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[rgb(var(--token-muted)/0.30)]">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-[var(--color-muted-fg)]">
                      {r.createdAt.toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-[11px] font-medium">
                        {r.module}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{r.action}</td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                      {r.entityType ? (
                        <>
                          {r.entityType}
                          {r.entityId ? (
                            <span className="ml-1 font-mono text-xs">#{r.entityId.slice(0, 8)}</span>
                          ) : null}
                        </>
                      ) : (
                        "\u2014"
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-muted-fg)]">
                      {r.userId?.slice(0, 8) ?? "system"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-muted-fg)]">
                      {r.ipAddress ?? "\u2014"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/system/audit/${r.id}`}
                        className="text-xs text-[var(--color-primary)] hover:underline"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
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
