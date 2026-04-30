"use client";

import { useState, useTransition } from "react";
import {
  createCampaignAction,
  updateCampaignAction,
  deleteCampaignAction,
} from "@/lib/actions/campaigns";
import { Button } from "@/components/ui/Button";

type ProgramOption = { id: string; title: string };

type Initial = {
  id?: string;
  slug?: string;
  title?: string;
  description?: string;
  goalCents?: number;
  currency?: string;
  startsAt?: string;
  endsAt?: string;
  programId?: string;
  isActive?: boolean;
};

export function CampaignForm({ initial, programs = [] }: { initial?: Initial; programs?: ProgramOption[] }) {
  const isEdit = !!initial?.id;
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [goal, setGoal] = useState<string>(
    initial?.goalCents ? String(initial.goalCents / 100) : "",
  );
  const [currency, setCurrency] = useState(initial?.currency ?? "USD");
  const [startsAt, setStartsAt] = useState(initial?.startsAt ?? "");
  const [endsAt, setEndsAt] = useState(initial?.endsAt ?? "");
  const [programId, setProgramId] = useState(initial?.programId ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
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
          goalCents: goal ? Math.round(Number(goal) * 100) : null,
          currency,
          startsAt: startsAt ? new Date(startsAt).toISOString() : null,
          endsAt: endsAt ? new Date(endsAt).toISOString() : null,
          programId: programId || null,
          isActive,
        };
        if (isEdit) await updateCampaignAction({ id: initial!.id!, ...payload });
        else await createCampaignAction(payload);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
      }
    });
  };

  const del = () => {
    if (!initial?.id) return;
    if (!confirm("Delete this campaign? Donations remain but are unlinked.")) return;
    start(async () => {
      try {
        await deleteCampaignAction({ id: initial.id });
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
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Goal amount">
            <input type="number" min={0} step="0.01" value={goal} onChange={(e) => setGoal(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Currency (ISO-4217)">
            <input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={3} className={inputCls} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Starts at">
            <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Ends at">
            <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Linked program (optional)">
          <select value={programId} onChange={(e) => setProgramId(e.target.value)} className={inputCls}>
            <option value="">— No program —</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Campaign is active
        </label>
      </section>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 space-y-3">
          {error ? (
            <p role="alert" className="rounded-[var(--radius-sm)] bg-[rgb(var(--token-danger)/0.10)] p-2 text-sm text-[var(--color-danger)]">
              {error}
            </p>
          ) : null}
          <Button onClick={submit} disabled={pending} className="w-full">
            {pending ? "Saving\u2026" : isEdit ? "Save changes" : "Create campaign"}
          </Button>
          {isEdit ? (
            <Button variant="outline" onClick={del} disabled={pending} className="w-full">
              Delete campaign
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
