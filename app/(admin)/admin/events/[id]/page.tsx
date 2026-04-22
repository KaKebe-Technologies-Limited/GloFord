import { notFound } from "next/navigation";
import { requireActorFromSession } from "@/lib/auth-context";
import { getEventForEdit } from "@/lib/services/events";
import { EventForm } from "../EventForm";
import { NotificationList } from "./NotificationList";

export const metadata = { title: "Edit event" };

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requireActorFromSession();
  const row = await getEventForEdit(actor.orgId, id);
  if (!row) notFound();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{row.title}</h1>
        <p className="text-sm text-[--color-muted-fg]">
          Starts {row.startsAt.toLocaleString()}
        </p>
      </header>

      <EventForm
        initial={{
          id: row.id,
          slug: row.slug,
          title: row.title,
          description: row.description,
          startsAt: row.startsAt.toISOString(),
          endsAt: row.endsAt ? row.endsAt.toISOString() : null,
          location: row.location,
          coverMediaId: row.coverMediaId,
          isPublic: row.isPublic,
          segmentIds: row.segments.map((s) => s.id),
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
