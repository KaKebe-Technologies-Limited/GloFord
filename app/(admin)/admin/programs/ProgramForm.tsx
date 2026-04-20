"use client";

import { useState, useTransition } from "react";
import {
  createProgramAction,
  updateProgramAction,
  deleteProgramAction,
} from "@/lib/actions/programs";
import { BlockEditor } from "@/components/blocks/BlockEditor";
import { Button } from "@/components/ui/Button";
import type { Block } from "@/lib/blocks/types";

type Initial = {
  id?: string;
  slug?: string;
  title?: string;
  summary?: string;
  body?: Block[];
  coverMediaId?: string;
  order?: number;
};

export function ProgramForm({ initial }: { initial?: Initial }) {
  const isEdit = !!initial?.id;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [coverMediaId, setCoverMediaId] = useState(initial?.coverMediaId ?? "");
  const [order, setOrder] = useState(initial?.order ?? 0);
  const [body, setBody] = useState<Block[]>(initial?.body ?? []);
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
        <section className="rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[--color-muted-fg]">Details</h2>
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
            <Field label="Cover media ID">
              <input value={coverMediaId} onChange={(e) => setCoverMediaId(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Order" hint="Lower number = shown first">
              <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} className={inputCls} />
            </Field>
          </div>
        </section>

        <section className="rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[--color-muted-fg]">Content blocks</h2>
          <BlockEditor value={body} onChange={setBody} />
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] p-5 space-y-3">
          {error ? (
            <p role="alert" className="rounded-[--radius-sm] bg-[--color-danger]/10 p-2 text-sm text-[--color-danger]">
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
  "w-full rounded-[--radius-md] border border-[--color-input] bg-[--color-bg] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-ring]";

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
      {hint ? <span className="block text-xs text-[--color-muted-fg]">{hint}</span> : null}
      {children}
    </label>
  );
}
