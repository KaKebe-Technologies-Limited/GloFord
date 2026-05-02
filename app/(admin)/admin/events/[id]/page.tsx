import { notFound } from "next/navigation";
import Link from "next/link";
import { Users } from "lucide-react";
import { requireActorFromSession } from "@/lib/auth-context";
import { getEventForEdit } from "@/lib/services/events";
import { listSegments } from "@/lib/services/segments";
import { getRegistrationCounts } from "@/lib/services/events/registration";
import { EventForm } from "../EventForm";
import { NotificationList } from "./NotificationList";

export const metadata = { title: "Edit event" };

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireActorFromSession();
  const [row, allSegments] = await Promise.all([
    getEventForEdit(id),
    listSegments(),
  ]);
  if (!row) notFound();
  const counts = await getRegistrationCounts(id);

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{row.title}</h1>
          <p className="text-sm text-[var(--color-muted-fg)]">
            Starts {row.startsAt.toLocaleString()}
          </p>
        </div>
        <Link
          href={`/admin/events/${id}/attendees`}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm font-medium hover:bg-[var(--color-muted)]"
        >
          <Users className="h-4 w-4" />
          {counts.going} attendee{counts.going !== 1 ? "s" : ""}
        </Link>
      </header>

      <EventForm
        segments={allSegments.map((s) => ({ id: s.id, name: s.name }))}
        initial={{
          id: row.id,
          slug: row.slug,
          title: row.title,
          description: row.description,
          startsAt: row.startsAt.toISOString(),
          endsAt: row.endsAt ? row.endsAt.toISOString() : null,
          location: row.location,
          coverMediaId: row.coverMediaId,
          coverUrl: row.cover?.url ?? null,
          isPublic: row.isPublic,
          segmentIds: row.segments.map((s) => s.id),
          seoTitle: row.seoTitle ?? null,
          seoDesc: row.seoDesc ?? null,
        }}
      />

      <NotificationList
        eventId={row.id}
        notifications={row.notifications.map((n) => ({
          id: n.id,
          type: n.type,
          subject: n.subject,
          sendAt: n.sendAt.toISOString(),
          status: n.status,
        }))}
      />
    </div>
  );
}
