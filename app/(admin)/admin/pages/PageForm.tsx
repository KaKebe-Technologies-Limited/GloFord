"use client";

import { useState, useTransition } from "react";
import { createPageAction, updatePageAction, deletePageAction } from "@/lib/actions/pages";
import dynamic from "next/dynamic";

const BlockEditor = dynamic(
  () => import("@/components/blocks/BlockEditor").then((m) => ({ default: m.BlockEditor })),
  { ssr: false },
);
import { Button } from "@/components/ui/Button";
import type { Block } from "@/lib/blocks/types";

type Initial = {
  id?: string;
  slug?: string;
  title?: string;
  seoTitle?: string;
  seoDesc?: string;
  blocks?: Block[];
};

export function PageForm({ initial }: { initial?: Initial }) {
  const isEdit = !!initial?.id;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? "");
  const [seoDesc, setSeoDesc] = useState(initial?.seoDesc ?? "");
  const [blocks, setBlocks] = useState<Block[]>(initial?.blocks ?? []);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () => {
    setError(null);
    start(async () => {
      try {
        if (isEdit) {
          await updatePageAction({ id: initial!.id!, title, slug, seoTitle, seoDesc, blocks });
        } else {
          await createPageAction({ title, slug, seoTitle, seoDesc, blocks });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
      }
    });
  };

  const del = () => {
    if (!initial?.id) return;
    if (!confirm("Delete this page? This cannot be undone.")) return;
    start(async () => {
      try {
        await deletePageAction({ id: initial.id });
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
          <Field label="Slug" hint="Lowercase, hyphens only. Used in URL: /slug">
            <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputCls} />
          </Field>
          <Field label="SEO title">
            <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className={inputCls} />
          </Field>
          <Field label="SEO description">
            <textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} rows={3} className={inputCls} />
          </Field>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">Content blocks</h2>
          <BlockEditor value={blocks} onChange={setBlocks} />
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
            {pending ? "Saving\u2026" : isEdit ? "Save changes" : "Create page"}
          </Button>
          {isEdit ? (
            <Button variant="outline" onClick={del} disabled={pending} className="w-full">
              Delete page
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
