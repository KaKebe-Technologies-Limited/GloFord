import Link from "next/link";
import { requireActorFromSession } from "@/lib/auth-context";
import { listVersions, listVersionEntityTypes } from "@/lib/services/system";
import { RestoreButton } from "./RestoreButton";

export const metadata = { title: "Version history" };

export default async function VersionsPage({
  searchParams,
}: {
  searchParams: Promise<{ entityType?: string; entityId?: string; cursor?: string }>;
}) {
  const params = await searchParams;
  await requireActorFromSession();
  const [{ items, nextCursor, hasMore }, entityTypes] = await Promise.all([
    listVersions({
      entityType: params.entityType || undefined,
      entityId: params.entityId || undefined,
      cursor: params.cursor || undefined,
    }),
    listVersionEntityTypes(),
  ]);

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { ...params, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    return `/admin/system/versions?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Version history</h1>
        <p className="text-sm text-[var(--color-muted-fg)]">
          Point-in-time snapshots of every versioned entity. Inspect diffs or restore to any version.
        </p>
      </header>

      <form className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="ver-type" className="text-xs font-medium text-[var(--color-muted-fg)]">Entity type</label>
          <select
            id="ver-type"
            name="entityType"
            defaultValue={params.entityType ?? ""}
            className="rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {entityTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="ver-id" className="text-xs font-medium text-[var(--color-muted-fg)]">Entity ID</label>
          <input
            id="ver-id"
            name="entityId"
            defaultValue={params.entityId ?? ""}
            placeholder="Optional CUID"
            className="w-56 rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
        >
          Filter
        </button>
        {(params.entityType || params.entityId) && (
          <Link href="/admin/system/versions" className="text-sm text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]">
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
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3 w-0">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[var(--color-muted-fg)]">
                    No versions recorded yet.
                  </td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[rgb(var(--token-muted)/0.20)]">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-[var(--color-muted-fg)]">
                      {r.createdAt.toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{r.entityType}</span>
                      <span className="ml-1 font-mono text-xs text-[var(--color-muted-fg)]">
                        #{r.entityId.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-xs font-medium">
                        v{r.version}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-muted-fg)]">
                      {r.createdById.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/system/versions/${r.id}`}
                          className="text-xs text-[var(--color-primary)] hover:underline"
                        >
                          Inspect
                        </Link>
                        <RestoreButton id={r.id} />
                      </div>
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
