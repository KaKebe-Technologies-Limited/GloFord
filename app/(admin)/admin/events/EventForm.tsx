"use client";

import { useState, useTransition } from "react";
import {
  createEventAction,
  updateEventAction,
  deleteEventAction,
} from "@/lib/actions/events";
import { Button } from "@/components/ui/Button";
import { MediaPicker } from "@/components/ui/MediaPicker";

type SegmentOption = { id: string; name: string };

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
  seoTitle?: string | null;
  seoDesc?: string | null;
};

function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({ initial, segments = [] }: { initial?: Initial; segments?: SegmentOption[] }) {
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
  const [selectedSegments, setSelectedSegments] = useState<string[]>(initial?.segmentIds ?? []);
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? "");
  const [seoDesc, setSeoDesc] = useState(initial?.seoDesc ?? "");
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
          segmentIds: selectedSegments,
          seoTitle: seoTitle || null,
          seoDesc: seoDesc || null,
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
      <section className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
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
        <Field label="Notification segments">
          {segments.length === 0 ? (
            <p className="text-xs text-[var(--color-muted-fg)]">No segments created yet. All active subscribers will be notified.</p>
          ) : (
            <div className="space-y-1">
              {segments.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedSegments.includes(s.id)}
                    onChange={() =>
                      setSelectedSegments((prev) =>
                        prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id],
                      )
                    }
                  />
                  {s.name}
                </label>
              ))}
              <p className="text-xs text-[var(--color-muted-fg)]">
                {selectedSegments.length === 0 ? "All active subscribers" : `${selectedSegments.length} segment${selectedSegments.length === 1 ? "" : "s"} selected`}
              </p>
            </div>
          )}
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

      {/* SEO */}
      <section className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-fg)]">SEO & Social</h2>
        <div>
          <label className="mb-1.5 block text-sm font-medium">SEO title <span className="text-[var(--color-muted-fg)] font-normal">(overrides event title in search results)</span>
            <input type="text" value={seoTitle} onChange={e => setSeoTitle(e.target.value)} placeholder={title} maxLength={200} className={inputCls} />
          </label>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Meta description <span className="text-[var(--color-muted-fg)] font-normal">(overrides description for OG/search)</span>
            <textarea value={seoDesc} onChange={e => setSeoDesc(e.target.value)} rows={3} maxLength={400} className={inputCls} />
          </label>
        </div>
      </section>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          {error ? (
            <p
              role="alert"
              className="rounded-[var(--radius-sm)] bg-[rgb(var(--token-danger)/0.10)] p-2 text-sm text-[var(--color-danger)]"
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
  "w-full rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
