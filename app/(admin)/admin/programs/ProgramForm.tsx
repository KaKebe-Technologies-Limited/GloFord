"use client";

import { useState, useTransition } from "react";
import {
  createProgramAction,
  updateProgramAction,
  deleteProgramAction,
} from "@/lib/actions/programs";
import dynamic from "next/dynamic";

const BlockEditor = dynamic(
  () => import("@/components/blocks/BlockEditor").then((m) => ({ default: m.BlockEditor })),
  { ssr: false },
);
import { Button } from "@/components/ui/Button";
import { MediaPicker } from "@/components/ui/MediaPicker";
import type { Block } from "@/lib/blocks/types";

type Initial = {
  id?: string;
  slug?: string;
  title?: string;
  summary?: string;
  body?: Block[];
  coverMediaId?: string;
  coverUrl?: string | null;
  order?: number;
  seoTitle?: string | null;
  seoDesc?: string | null;
};

export function ProgramForm({ initial }: { initial?: Initial }) {
  const isEdit = !!initial?.id;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [coverMediaId, setCoverMediaId] = useState(initial?.coverMediaId ?? "");
  const [coverUrl, setCoverUrl] = useState<string | null>(initial?.coverUrl ?? null);
  const [order, setOrder] = useState(initial?.order ?? 0);
  const [body, setBody] = useState<Block[]>(initial?.body ?? []);
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? "");
  const [seoDesc, setSeoDesc] = useState(initial?.seoDesc ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () => {
    setError(null);
    start(async () => {
      try {
        const payload = {
          title,
          slug,
          summary,
          body,
          coverMediaId: coverMediaId || null,
          order: Number(order),
          seoTitle: seoTitle || null,
          seoDesc: seoDesc || null,
        };
        if (isEdit) {
          await updateProgramAction({ id: initial!.id!, ...payload });
        } else {
          await createProgramAction(payload);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
      }
    });
  };

  const del = () => {
    if (!initial?.id) return;
    if (!confirm("Delete this program?")) return;
    start(async () => {
      try {
        await deleteProgramAction({ id: initial.id });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete");
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-6">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">Details</h2>
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Slug">
            <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Summary" hint="Short description shown in listings">
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cover image">
              <MediaPicker
                value={coverMediaId}
                valueUrl={coverUrl}
                onChange={(p) => {
                  setCoverMediaId(p?.id ?? "");
                  setCoverUrl(p?.url ?? null);
                }}
                placeholder="Program cover"
              />
            </Field>
            <Field label="Order" hint="Lower number = shown first">
              <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} className={inputCls} />
            </Field>
          </div>
        </section>

        {/* SEO */}
        <section className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-fg)]">SEO & Social</h2>
          <div>
            <label className="mb-1.5 block text-sm font-medium">SEO title <span className="text-[var(--color-muted-fg)] font-normal">(overrides program title in search results)</span>
              <input type="text" value={seoTitle} onChange={e => setSeoTitle(e.target.value)} placeholder={title} maxLength={200} className={inputCls} />
            </label>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Meta description <span className="text-[var(--color-muted-fg)] font-normal">(overrides summary for OG/search)</span>
              <textarea value={seoDesc} onChange={e => setSeoDesc(e.target.value)} rows={3} maxLength={400} className={inputCls} />
            </label>
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">Content blocks</h2>
          <BlockEditor value={body} onChange={setBody} />
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 space-y-3">
          {error ? (
            <p role="alert" className="rounded-[var(--radius-sm)] bg-[rgb(var(--token-danger)/0.10)] p-2 text-sm text-[var(--color-danger)]">
              {error}
            </p>
          ) : null}
          <Button onClick={submit} disabled={pending} className="w-full">
            {pending ? "Saving\u2026" : isEdit ? "Save changes" : "Create program"}
          </Button>
          {isEdit ? (
            <Button variant="outline" onClick={del} disabled={pending} className="w-full">
              Delete program
            </Button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

const inputCls =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {hint ? <span className="block text-xs text-[var(--color-muted-fg)]">{hint}</span> : null}
      {children}
    </label>
  );
}
