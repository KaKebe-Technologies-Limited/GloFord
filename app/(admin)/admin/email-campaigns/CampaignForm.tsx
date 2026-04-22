"use client";

import { useState, useTransition } from "react";
import {
  createEmailCampaignAction,
  updateEmailCampaignAction,
  deleteEmailCampaignAction,
  activateEmailCampaignAction,
} from "@/lib/actions/emailCampaigns";
import { Button } from "@/components/ui/Button";

type Initial = {
  id?: string;
  name?: string;
  description?: string;
  trigger?: "ON_SIGNUP" | "ON_DONATION" | "SCHEDULED" | "MANUAL";
  isActive?: boolean;
  segmentIds?: string[];
};

export function CampaignForm({ initial }: { initial?: Initial }) {
  const isEdit = !!initial?.id;
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [trigger, setTrigger] = useState<Initial["trigger"]>(
    initial?.trigger ?? "ON_SIGNUP",
  );
  const [segmentIds, setSegmentIds] = useState<string>(
    (initial?.segmentIds ?? []).join(","),
  );
  const isActive = initial?.isActive ?? false;
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () => {
    setError(null);
    start(async () => {
      try {
        const payload = {
          name,
          description: description || undefined,
          trigger,
          segmentIds: segmentIds
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          isActive,
        };
        if (isEdit) await updateEmailCampaignAction({ id: initial!.id!, ...payload });
        else await createEmailCampaignAction(payload);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
      }
    });
  };

  const toggleActive = () => {
    if (!initial?.id) return;
    start(async () => {
      try {
        await activateEmailCampaignAction({ id: initial.id, isActive: !initial.isActive });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to toggle");
      }
    });
  };

  const del = () => {
    if (!initial?.id) return;
    if (!confirm("Delete this campaign? This cannot be undone.")) return;
    start(async () => {
      try {
        await deleteEmailCampaignAction({ id: initial.id });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete");
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <section className="space-y-4 rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] p-5">
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Description (optional)">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={inputCls}
          />
        </Field>
        <Field label="Trigger">
          <select
            value={trigger}
            onChange={(e) => setTrigger(e.target.value as Initial["trigger"])}
            className={inputCls}
          >
            <option value="ON_SIGNUP">On signup (welcome drip)</option>
            <option value="ON_DONATION">On donation (thank-you drip)</option>
            <option value="SCHEDULED">Scheduled (cron-driven)</option>
            <option value="MANUAL">Manual enrollment only</option>
          </select>
        </Field>
        <Field label="Segment ids (comma-separated, optional)">
          <input
            value={segmentIds}
            onChange={(e) => setSegmentIds(e.target.value)}
            placeholder="Leave blank to target all active subscribers"
            className={inputCls}
          />
        </Field>
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
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create campaign"}
          </Button>
          {isEdit ? (
            <>
              <Button variant="outline" onClick={toggleActive} disabled={pending} className="w-full">
                {initial?.isActive ? "Pause campaign" : "Activate campaign"}
              </Button>
              <Button variant="outline" onClick={del} disabled={pending} className="w-full">
                Delete campaign
              </Button>
            </>
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
