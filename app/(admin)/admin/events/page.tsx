import Link from "next/link";
import { Plus, CalendarDays } from "lucide-react";
import { requireActorFromSession } from "@/lib/auth-context";
import { listEvents } from "@/lib/services/events";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "Events" };

export default async function EventsPage() {
  await requireActorFromSession();
  const rows = await listEvents();
  const now = Date.now();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
          <p className="text-sm text-[var(--color-muted-fg)]">
            Community events, launches, and scheduled announcements.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/events/new">
            <Plus className="h-4 w-4" /> New event
          </Link>
        </Button>
      </header>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[rgb(var(--token-muted)/0.50)] text-left text-xs uppercase tracking-wider text-[var(--color-muted-fg)]">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Starts</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Visibility</th>
                <th className="px-4 py-3">State</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-[var(--color-muted-fg)]">
                    <CalendarDays className="mx-auto mb-2 h-6 w-6 opacity-60" aria-hidden="true" />
                    No events yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const ts = r.startsAt.getTime();
                  const state = ts > now ? "Upcoming" : r.endsAt && r.endsAt.getTime() > now ? "Live" : "Past";
                  return (
                    <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="px-4 py-3">
                        <Link href={`/admin/events/${r.id}`} className="font-medium hover:underline">
                          {r.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                        {r.startsAt.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-muted-fg)]">{r.location ?? "—"}</td>
                      <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                        {r.isPublic ? "Public" : "Private"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs " +
                            (state === "Live"
                              ? "bg-[rgb(var(--token-success)/0.10)] text-[var(--color-success)]"
                              : state === "Upcoming"
                              ? "bg-[rgb(var(--token-primary)/0.10)] text-[var(--color-primary)]"
                              : "bg-[var(--color-muted)] text-[var(--color-muted-fg)]")
                          }
                        >
                          {state}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
