import { requireActorFromSession } from "@/lib/auth-context";
import { listSegments } from "@/lib/services/segments";
import { EventForm } from "../EventForm";

export const metadata = { title: "New event" };

export default async function NewEventPage() {
  await requireActorFromSession();
  const segments = await listSegments();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New event</h1>
        <p className="text-sm text-[var(--color-muted-fg)]">
          Set up an event and schedule its announcements and reminders.
        </p>
      </header>
      <EventForm segments={segments.map((s) => ({ id: s.id, name: s.name }))} />
    </div>
  );
}
