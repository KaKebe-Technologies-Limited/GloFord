import { requireActorFromSession } from "@/lib/auth-context";
import { listDonors } from "@/lib/services/donations";
import { Pagination } from "@/components/admin/Pagination";

export const metadata = { title: "Donors" };

export default async function DonorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireActorFromSession();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, total, totalPages } = await listDonors({ page, perPage: 50 });

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Donors</h1>
          <p className="text-sm text-[var(--color-muted-fg)]">{total} donors on file.</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/exports/donors"
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm hover:bg-[var(--color-muted)]"
        >
          Export CSV
        </a>
      </header>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[rgb(var(--token-muted)/0.50)] text-left text-xs uppercase tracking-wider text-[var(--color-muted-fg)]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Successful donations</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[var(--color-muted-fg)]">
                    No donors yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-4 py-3 font-medium">{r.name ?? "\u2014"}</td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">{r.email}</td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">{r.country ?? "\u2014"}</td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">{r._count.donations}</td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} total={total} basePath="/admin/donors" />
    </div>
  );
}
