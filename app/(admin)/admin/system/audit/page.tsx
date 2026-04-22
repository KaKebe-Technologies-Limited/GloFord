import { requireActorFromSession } from "@/lib/auth-context";
import { listAuditLogs, listAuditModules } from "@/lib/services/system";

export const metadata = { title: "Audit log" };

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ module?: string }>;
}) {
  const { module: filterModule } = await searchParams;
  const actor = await requireActorFromSession();
  const [rows, modules] = await Promise.all([
    listAuditLogs(actor.orgId, { module: filterModule }),
    listAuditModules(actor.orgId),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="text-sm text-[--color-muted-fg]">
          Every write to the system — who, what, when. Showing the last {rows.length} events.
        </p>
      </header>

      <form className="flex items-center gap-3">
        <label htmlFor="audit-module" className="text-sm font-medium">
          Module
        </label>
        <select
          id="audit-module"
          name="module"
          aria-label="Filter by module"
          defaultValue={filterModule ?? ""}
          className="rounded-[--radius-md] border border-[--color-input] bg-[--color-bg] px-3 py-2 text-sm"
        >
          <option value="">All</option>
          {modules.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
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
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[--color-muted-fg]">
                    No audit events match this filter.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-[--color-border] last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-[--color-muted-fg]">
                      {r.createdAt.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium">{r.action}</td>
                    <td className="px-4 py-3 text-[--color-muted-fg]">
                      {r.entityType ? (
                        <>
                          {r.entityType}
                          {r.entityId ? (
                            <span className="ml-1 font-mono text-xs">#{r.entityId.slice(0, 8)}</span>
                          ) : null}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-[--color-muted-fg]">{r.userId ?? "system"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[--color-muted-fg]">
                      {r.ipAddress ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
