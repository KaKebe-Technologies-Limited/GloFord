import { EventForm } from "../EventForm";

export const metadata = { title: "New event" };

export default function NewEventPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New event</h1>
        <p className="text-sm text-[--color-muted-fg]">
          Set up an event and schedule its announcements and reminders.
        </p>
      </header>
      <EventForm />
    </div>
  );
}
