import { requireActorFromSession } from "@/lib/auth-context";
import { listSubscribers, countActiveSubscribers } from "@/lib/services/subscribers";
import { SubscriberStatusBadge } from "./StatusBadge";

export const metadata = { title: "Subscribers" };

export default async function SubscribersPage() {
  await requireActorFromSession();
  const [rows, activeCount] = await Promise.all([
    listSubscribers(),
    countActiveSubscribers(),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
        <h1 className="text-2xl font-semibold tracking-tight">Subscribers</h1>
        <p className="text-sm text-[--color-muted-fg]">
          {activeCount} active \u00b7 {rows.length} total (last 200)
        </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/exports/subscribers"
          className="inline-flex items-center gap-1.5 rounded-[--radius-md] border border-[--color-border] bg-[--color-card] px-3 py-2 text-sm hover:bg-[--color-muted]"
        >
          Export CSV
        </a>
      </header>

      <div className="overflow-hidden rounded-[--radius-lg] border border-[--color-border] bg-[--color-card]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[--color-border] bg-[--color-muted]/50 text-left text-xs uppercase tracking-wider text-[--color-muted-fg]">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Segments</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[--color-muted-fg]">
                    No subscribers yet.
                  </td>
                </tr>
              ) : (
                rows.map((s) => (
                  <tr key={s.id} className="border-b border-[--color-border] last:border-0 align-top">
                    <td className="px-4 py-3 font-medium">{s.email}</td>
                    <td className="px-4 py-3 text-[--color-muted-fg]">{s.name ?? "\u2014"}</td>
                    <td className="px-4 py-3">
                      <SubscriberStatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-3">
                      {s.segments.length === 0 ? (
                        <span className="text-[--color-muted-fg]">\u2014</span>
                      ) : (
                        <ul className="flex flex-wrap gap-1">
                          {s.segments.map((ss) => (
                            <li
                              key={ss.segment.slug}
                              className="rounded-full bg-[--color-muted] px-2 py-0.5 text-xs"
                            >
                              {ss.segment.name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[--color-muted-fg]">
                      {new Date(s.createdAt).toLocaleDateString()}
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
