import { requireActorFromSession } from "@/lib/auth-context";
import { listVersions, listVersionEntityTypes } from "@/lib/services/system";
import { RestoreButton } from "./RestoreButton";

export const metadata = { title: "Version history" };

export default async function VersionsPage({
  searchParams,
}: {
  searchParams: Promise<{ entityType?: string; entityId?: string }>;
}) {
  const { entityType, entityId } = await searchParams;
  await requireActorFromSession();
  const [rows, entityTypes] = await Promise.all([
    listVersions({ entityType, entityId }),
    listVersionEntityTypes(),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Version history</h1>
        <p className="text-sm text-[var(--color-muted-fg)]">
          Point-in-time snapshots of every versioned entity. Restore reverts content to that state.
        </p>
      </header>

      <form className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Entity type</span>
          <select
            name="entityType"
            aria-label="Filter by entity type"
            defaultValue={entityType ?? ""}
            className="rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {entityTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Entity id</span>
          <input
            name="entityId"
            defaultValue={entityId ?? ""}
            placeholder="Optional CUID"
            className="w-64 rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm hover:bg-[var(--color-muted)]"
        >
          Filter
        </button>
      </form>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[rgb(var(--token-muted)/0.50)] text-left text-xs uppercase tracking-wider text-[var(--color-muted-fg)]">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3 w-0">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[var(--color-muted-fg)]">
                    No versions recorded yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-[var(--color-muted-fg)]">
                      {r.createdAt.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{r.entityType}</span>
                      <span className="ml-1 font-mono text-xs text-[var(--color-muted-fg)]">
                        #{r.entityId.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">v{r.version}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-muted-fg)]">
                      {r.createdById.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3">
                      <RestoreButton id={r.id} />
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
