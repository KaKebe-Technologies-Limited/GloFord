"use client";

import { useState, useTransition } from "react";
import { CalendarPlus, Check, X } from "lucide-react";
import { registerForEventAction, cancelRegistrationAction } from "@/lib/actions/eventRegistration";

export function EventRsvp({
  eventId,
  eventSlug,
  capacity,
  goingCount,
  currentStatus,
}: {
  eventId: string;
  eventSlug: string;
  capacity: number | null;
  goingCount: number;
  currentStatus: string | null;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string | null>(currentStatus);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const isFull = capacity !== null && goingCount >= capacity;

  const register = () => {
    if (!email) return;
    setError(null);
    start(async () => {
      try {
        const res = await registerForEventAction({ eventId, email, name: name || undefined });
        setStatus(res.status);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Registration failed");
      }
    });
  };

  const cancel = () => {
    if (!email) return;
    start(async () => {
      try {
        await cancelRegistrationAction({ eventId, email });
        setStatus("CANCELED");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to cancel");
      }
    });
  };

  if (status === "GOING") {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--token-success)/0.3)] bg-[rgb(var(--token-success)/0.05)] p-5">
        <div className="flex items-center gap-2">
          <Check className="h-5 w-5 text-[var(--color-success)]" />
          <p className="font-medium text-[var(--color-success)]">You&apos;re registered!</p>
        </div>
        <p className="mt-2 text-sm text-[var(--color-muted-fg)]">
          We&apos;ll send a reminder before the event. You can also add it to your calendar.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <a
            href={`/api/events/${eventSlug}/ical`}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--color-muted)]"
          >
            <CalendarPlus className="h-4 w-4" /> Add to calendar
          </a>
          <button
            onClick={cancel}
            disabled={pending}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted-fg)] hover:text-[var(--color-danger)]"
          >
            <X className="h-4 w-4" /> Cancel registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
      <h3 className="text-sm font-semibold">Register for this event</h3>
      {isFull ? (
        <p className="mt-2 text-sm text-[var(--color-danger)]">This event is at capacity.</p>
      ) : (
        <>
          {capacity && (
            <p className="mt-1 text-xs text-[var(--color-muted-fg)]">
              {capacity - goingCount} spot{capacity - goingCount !== 1 ? "s" : ""} remaining
            </p>
          )}
          <div className="mt-3 space-y-2">
            <input
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
            />
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
            />
            <button
              onClick={register}
              disabled={pending || !email}
              className="w-full rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
            >
              {pending ? "Registering\u2026" : "Register"}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-[var(--color-danger)]">{error}</p>
          )}
        </>
      )}
      {goingCount > 0 && (
        <p className="mt-3 text-xs text-[var(--color-muted-fg)]">
          {goingCount} {goingCount === 1 ? "person" : "people"} registered
        </p>
      )}
    </div>
  );
}
