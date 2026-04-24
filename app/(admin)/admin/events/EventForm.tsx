"use client";

import { useState, useTransition } from "react";
import {
  createEventAction,
  updateEventAction,
  deleteEventAction,
} from "@/lib/actions/events";
import { Button } from "@/components/ui/Button";
import { MediaPicker } from "@/components/ui/MediaPicker";

type Initial = {
  id?: string;
  slug?: string;
  title?: string;
  description?: string;
  startsAt?: string;
  endsAt?: string | null;
  location?: string | null;
  coverMediaId?: string | null;
  coverUrl?: string | null;
  isPublic?: boolean;
  segmentIds?: string[];
};

function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({ initial }: { initial?: Initial }) {
  const isEdit = !!initial?.id;
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [startsAt, setStartsAt] = useState(toLocalInput(initial?.startsAt));
  const [endsAt, setEndsAt] = useState(toLocalInput(initial?.endsAt));
  const [location, setLocation] = useState(initial?.location ?? "");
  const [coverMediaId, setCoverMediaId] = useState(initial?.coverMediaId ?? "");
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl ?? "");
  const [isPublic, setIsPublic] = useState(initial?.isPublic ?? true);
  const [segmentIds, setSegmentIds] = useState<string>((initial?.segmentIds ?? []).join(","));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () => {
    setError(null);
    start(async () => {
      try {
        const payload = {
          slug,
          title,
          description,
          startsAt: startsAt ? new Date(startsAt).toISOString() : null,
          endsAt: endsAt ? new Date(endsAt).toISOString() : null,
          location: location || null,
          coverMediaId: coverMediaId || null,
          isPublic,
          segmentIds: segmentIds
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        };
        if (isEdit) await updateEventAction({ id: initial!.id!, ...payload });
        else await createEventAction(payload);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
      }
    });
  };

  const del = () => {
    if (!initial?.id) return;
    if (!confirm("Delete this event? All notifications will also be removed.")) return;
    start(async () => {
      try {
        await deleteEventAction({ id: initial.id });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete");
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <section className="space-y-4 rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] p-5">
        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Slug">
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Starts at">
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Ends at (optional)">
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Location (optional)">
          <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Cover image (optional)">
          <MediaPicker
            value={coverMediaId}
            valueUrl={coverUrl}
            onChange={(picked) => {
              setCoverMediaId(picked?.id ?? "");
              setCoverUrl(picked?.url ?? "");
            }}
            placeholder="Event cover"
          />
        </Field>
        <Field label="Notification segment ids (comma-separated)">
          <input
            value={segmentIds}
            onChange={(e) => setSegmentIds(e.target.value)}
            placeholder="Leave blank to notify all active subscribers"
            className={inputCls}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          Public (show on the website)
        </label>
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
          <Button onClick={submit} disabled={pending} className="w-full">
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create event"}
          </Button>
          {isEdit ? (
            <Button variant="outline" onClick={del} disabled={pending} className="w-full">
              Delete event
            </Button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

const inputCls =
  "w-full rounded-[--radius-md] border border-[--color-input] bg-[--color-bg] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-ring]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
