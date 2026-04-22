"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Clock, Mail, Pencil, Trash2 } from "lucide-react";
import {
  createCampaignEmailAction,
  updateCampaignEmailAction,
  deleteCampaignEmailAction,
} from "@/lib/actions/emailCampaigns";
import { Button } from "@/components/ui/Button";

type Step = {
  id: string;
  stepOrder: number;
  subject: string;
  preheader: string;
  delayMinutes: number;
};

export function StepList({
  campaignId,
  steps,
}: {
  campaignId: string;
  steps: Step[];
}) {
  const [draft, setDraft] = useState({
    subject: "",
    preheader: "",
    delayMinutes: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const nextOrder = steps.length ? Math.max(...steps.map((s) => s.stepOrder)) + 1 : 0;

  const add = () => {
    setError(null);
    start(async () => {
      try {
        await createCampaignEmailAction({
          campaignId,
          stepOrder: nextOrder,
          subject: draft.subject,
          preheader: draft.preheader || undefined,
          delayMinutes: draft.delayMinutes,
          content: [],
        });
        setDraft({ subject: "", preheader: "", delayMinutes: 0 });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add step");
      }
    });
  };

  const updateDelay = (id: string, delayMinutes: number) => {
    start(async () => {
      try {
        await updateCampaignEmailAction({ id, delayMinutes });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update delay");
      }
    });
  };

  const del = (id: string) => {
    if (!confirm("Delete this step?")) return;
    start(async () => {
      try {
        await deleteCampaignEmailAction({ id });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete");
      }
    });
  };

  return (
    <section className="space-y-4">
      <header className="flex items-center gap-2">
        <Mail className="h-5 w-5 text-[--color-muted-fg]" aria-hidden="true" />
        <h2 className="text-lg font-semibold">Email steps</h2>
      </header>

      <div className="rounded-[--radius-lg] border border-[--color-border] bg-[--color-card]">
        {steps.length === 0 ? (
          <p className="px-4 py-6 text-sm text-[--color-muted-fg]">
            Add the first email in the sequence below.
          </p>
        ) : (
          <ol className="divide-y divide-[--color-border]">
            {steps.map((s, i) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[--color-primary] text-xs font-semibold text-[--color-primary-fg]">
                  {i + 1}
                </span>
                <Link
                  href={`/admin/email-campaigns/${campaignId}/steps/${s.id}`}
                  className="flex-1 font-medium hover:underline"
                >
                  {s.subject}
                </Link>
                <label className="flex items-center gap-1.5 text-xs text-[--color-muted-fg]">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  Delay (min):
                  <input
                    type="number"
                    min={0}
                    defaultValue={s.delayMinutes}
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (v !== s.delayMinutes) updateDelay(s.id, v);
                    }}
                    className="w-20 rounded-[--radius-sm] border border-[--color-input] bg-[--color-bg] px-2 py-1 text-sm"
                  />
                </label>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/email-campaigns/${campaignId}/steps/${s.id}`}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Link>
                </Button>
                <Button size="sm" variant="outline" onClick={() => del(s.id)} disabled={pending}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="space-y-3 rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] p-4">
        <h3 className="text-sm font-semibold">Add a step</h3>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_120px_auto]">
          <input
            value={draft.subject}
            onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
            placeholder="Subject line"
            className={inputCls}
          />
          <input
            value={draft.preheader}
            onChange={(e) => setDraft((d) => ({ ...d, preheader: e.target.value }))}
            placeholder="Preheader (optional)"
            className={inputCls}
          />
          <input
            type="number"
            min={0}
            value={draft.delayMinutes}
            onChange={(e) =>
              setDraft((d) => ({ ...d, delayMinutes: Number(e.target.value) || 0 }))
            }
            placeholder="Delay (min)"
            className={inputCls}
          />
          <Button onClick={add} disabled={pending || !draft.subject.trim()}>
            Add step
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
