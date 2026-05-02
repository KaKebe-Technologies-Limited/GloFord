import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Download } from "lucide-react";
import { requireActorFromSession } from "@/lib/auth-context";
import { db } from "@/lib/db";
import { getEventRegistrations } from "@/lib/services/events/registration";

export const metadata = { title: "Event Attendees" };

export default async function AttendeesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireActorFromSession();

  const event = await db.event.findUnique({
    where: { id },
    select: { id: true, title: true, capacity: true },
  });
  if (!event) notFound();

  const registrations = await getEventRegistrations(id);
  const going = registrations.filter((r) => r.status === "GOING");
  const interested = registrations.filter((r) => r.status === "INTERESTED");
  const canceled = registrations.filter((r) => r.status === "CANCELED");

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/events/${id}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-muted-fg)] hover:bg-[var(--color-muted)] hover:text-[var(--color-fg)]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Attendees</h1>
            <p className="text-sm text-[var(--color-muted-fg)]">{event.title}</p>
          </div>
        </div>
        <Link
          href={`/api/exports/event-attendees?eventId=${id}`}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm font-medium hover:bg-[var(--color-muted)]"
        >
          <Download className="h-4 w-4" /> Export CSV
        </Link>
      </header>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Going" value={going.length} capacity={event.capacity} accent />
        <StatCard label="Interested" value={interested.length} />
        <StatCard label="Canceled" value={canceled.length} />
      </div>

      {/* Attendee table */}
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]">
        {registrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-8 w-8 text-[var(--color-muted-fg)]" />
            <p className="mt-3 text-sm text-[var(--color-muted-fg)]">No registrations yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--color-border)] bg-[rgb(var(--token-muted)/0.50)] text-left text-xs uppercase tracking-wider text-[var(--color-muted-fg)]">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Registered</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-4 py-3 font-medium">{r.name || "\u2014"}</td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">{r.email}</td>
                    <td className="px-4 py-3">
                      <RsvpBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                      {new Date(r.registeredAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  capacity,
  accent,
}: {
  label: string;
  value: number;
  capacity?: number | null;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted-fg)]">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold ${accent ? "text-[var(--color-primary)]" : "text-[var(--color-fg)]"}`}>
        {value}
        {capacity ? <span className="text-sm font-normal text-[var(--color-muted-fg)]"> / {capacity}</span> : null}
      </p>
    </div>
  );
}

function RsvpBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    GOING: "bg-[rgb(var(--token-success)/0.10)] text-[var(--color-success)]",
    INTERESTED: "bg-[rgb(var(--token-primary)/0.10)] text-[var(--color-primary)]",
    CANCELED: "bg-[var(--color-muted)] text-[var(--color-muted-fg)]",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${styles[status] ?? styles.CANCELED}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
