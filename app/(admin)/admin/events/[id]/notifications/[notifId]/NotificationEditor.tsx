"use client";

import { useState, useTransition } from "react";
import { Send, Save } from "lucide-react";
import {
  updateEventNotificationAction,
  sendEventNotificationAction,
} from "@/lib/actions/events";
import { BlockEditor } from "@/components/blocks/BlockEditor";
import { Button } from "@/components/ui/Button";
import type { Block } from "@/lib/blocks/types";

type Initial = {
  id: string;
  type: "ANNOUNCEMENT" | "REMINDER";
  subject: string;
  sendAt: string;
  content: Block[];
  status: string;
};

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function NotificationEditor({ initial }: { initial: Initial }) {
  const readOnly = initial.status === "SENT" || initial.status === "SENDING";
  const [type, setType] = useState(initial.type);
  const [subject, setSubject] = useState(initial.subject);
  const [sendAt, setSendAt] = useState(toLocalInput(initial.sendAt));
  const [content, setContent] = useState<Block[]>(initial.content);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = () => {
    setError(null);
    start(async () => {
      try {
        await updateEventNotificationAction({
          id: initial.id,
          type,
          subject,
          sendAt: new Date(sendAt).toISOString(),
          content,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
      }
    });
  };

  const sendNow = () => {
    if (!confirm("Send this notification now to all eligible subscribers?")) return;
    start(async () => {
      try {
        await sendEventNotificationAction({ id: initial.id });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to send");
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <section className="space-y-4">
        <div className="grid gap-4 rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] p-5 md:grid-cols-[160px_1fr_220px]">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Kind</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "ANNOUNCEMENT" | "REMINDER")}
              disabled={readOnly}
              className={inputCls}
            >
              <option value="ANNOUNCEMENT">Announcement</option>
              <option value="REMINDER">Reminder</option>
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Subject</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={readOnly}
              className={inputCls}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Send at</span>
            <input
              type="datetime-local"
              value={sendAt}
              onChange={(e) => setSendAt(e.target.value)}
              disabled={readOnly}
              className={inputCls}
            />
          </label>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[--color-muted-fg]">
            Content
          </h2>
          {readOnly ? (
            <p className="rounded-[--radius-md] border border-[--color-border] bg-[--color-muted] p-4 text-sm text-[--color-muted-fg]">
              This notification has been sent and can no longer be edited.
            </p>
          ) : (
            <BlockEditor value={content} onChange={setContent} />
          )}
        </div>
      </section>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="space-y-3 rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] p-5">
          {error ? (
            <p
              role="alert"
              className="rounded-[--radius-sm] bg-[--color-danger]/10 p-2 text-sm text-[--color-danger]"
            >
              {error}
            </p>
          ) : null}
          <Button onClick={save} disabled={pending || readOnly} className="w-full">
            <Save className="h-4 w-4" /> {pending ? "Saving…" : "Save"}
          </Button>
          {!readOnly ? (
            <Button
              variant="outline"
              onClick={sendNow}
              disabled={pending}
              className="w-full"
            >
              <Send className="h-4 w-4" /> Send now
            </Button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

const inputCls =
  "w-full rounded-[--radius-md] border border-[--color-input] bg-[--color-bg] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-ring] disabled:opacity-60";
