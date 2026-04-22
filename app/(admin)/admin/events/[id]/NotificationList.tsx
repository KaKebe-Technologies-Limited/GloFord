"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bell, Clock, Pencil, Send, Trash2 } from "lucide-react";
import {
  createEventNotificationAction,
  deleteEventNotificationAction,
  sendEventNotificationAction,
} from "@/lib/actions/events";
import { Button } from "@/components/ui/Button";

type Notif = {
  id: string;
  type: "ANNOUNCEMENT" | "REMINDER";
  subject: string;
  sendAt: string;
  status: string;
};

export function NotificationList({
  eventId,
  notifications,
}: {
  eventId: string;
  notifications: Notif[];
}) {
  const editHref = (id: string) => `/admin/events/${eventId}/notifications/${id}`;
  const [draft, setDraft] = useState({
    type: "ANNOUNCEMENT" as "ANNOUNCEMENT" | "REMINDER",
    subject: "",
    sendAt: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const add = () => {
    setError(null);
    start(async () => {
      try {
        await createEventNotificationAction({
          eventId,
          type: draft.type,
          subject: draft.subject,
          sendAt: draft.sendAt ? new Date(draft.sendAt).toISOString() : new Date().toISOString(),
          content: [],
        });
        setDraft({ type: "ANNOUNCEMENT", subject: "", sendAt: "" });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add notification");
      }
    });
  };

  const send = (id: string) => {
    if (!confirm("Send this notification now?")) return;
    start(async () => {
      try {
        await sendEventNotificationAction({ id });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to send");
      }
    });
  };

  const del = (id: string) => {
    if (!confirm("Delete this notification?")) return;
    start(async () => {
      try {
        await deleteEventNotificationAction({ id });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete");
      }
    });
  };

  return (
    <section className="space-y-4">
      <header className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-[--color-muted-fg]" aria-hidden="true" />
        <h2 className="text-lg font-semibold">Notifications</h2>
      </header>

      <div className="rounded-[--radius-lg] border border-[--color-border] bg-[--color-card]">
        {notifications.length === 0 ? (
          <p className="px-4 py-6 text-sm text-[--color-muted-fg]">
            No notifications yet. Add an announcement or reminder below.
          </p>
        ) : (
          <ul className="divide-y divide-[--color-border]">
            {notifications.map((n) => (
              <li key={n.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="inline-flex items-center rounded-full bg-[--color-muted] px-2 py-0.5 text-xs text-[--color-muted-fg]">
                  {n.type}
                </span>
                <Link href={editHref(n.id)} className="flex-1 font-medium hover:underline">
                  {n.subject}
                </Link>
                <span className="flex items-center gap-1 text-xs text-[--color-muted-fg]">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {new Date(n.sendAt).toLocaleString()}
                </span>
                <span className="text-xs uppercase tracking-wide text-[--color-muted-fg]">
                  {n.status}
                </span>
                <Button asChild size="sm" variant="outline">
                  <Link href={editHref(n.id)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Link>
                </Button>
                {n.status === "DRAFT" || n.status === "SCHEDULED" ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => send(n.id)}
                      disabled={pending}
                    >
                      <Send className="h-3.5 w-3.5" /> Send now
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => del(n.id)}
                      disabled={pending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3 rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] p-4">
        <h3 className="text-sm font-semibold">Add a notification</h3>
        <div className="grid gap-3 md:grid-cols-[140px_1fr_220px_auto]">
          <select
            aria-label="Notification type"
            value={draft.type}
            onChange={(e) =>
              setDraft((d) => ({ ...d, type: e.target.value as "ANNOUNCEMENT" | "REMINDER" }))
            }
            className={inputCls}
          >
            <option value="ANNOUNCEMENT">Announcement</option>
            <option value="REMINDER">Reminder</option>
          </select>
          <input
            value={draft.subject}
            onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
            placeholder="Subject line"
            className={inputCls}
          />
          <input
            aria-label="Send at"
            type="datetime-local"
            value={draft.sendAt}
            onChange={(e) => setDraft((d) => ({ ...d, sendAt: e.target.value }))}
            className={inputCls}
          />
          <Button onClick={add} disabled={pending || !draft.subject.trim()}>
            Add
          </Button>
        </div>
        {error ? (
          <p
            role="alert"
            className="rounded-[--radius-sm] bg-[--color-danger]/10 p-2 text-sm text-[--color-danger]"
          >
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}

const inputCls =
  "w-full rounded-[--radius-md] border border-[--color-input] bg-[--color-bg] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-ring]";
