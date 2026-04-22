"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { updateCampaignEmailAction } from "@/lib/actions/emailCampaigns";
import { BlockEditor } from "@/components/blocks/BlockEditor";
import { Button } from "@/components/ui/Button";
import type { Block } from "@/lib/blocks/types";

type Initial = {
  id: string;
  stepOrder: number;
  subject: string;
  preheader: string;
  delayMinutes: number;
  content: Block[];
};

export function StepEditor({ initial }: { initial: Initial }) {
  const [subject, setSubject] = useState(initial.subject);
  const [preheader, setPreheader] = useState(initial.preheader);
  const [delayMinutes, setDelayMinutes] = useState(initial.delayMinutes);
  const [content, setContent] = useState<Block[]>(initial.content);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = () => {
    setError(null);
    start(async () => {
      try {
        await updateCampaignEmailAction({
          id: initial.id,
          subject,
          preheader: preheader || undefined,
          delayMinutes,
          content,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <section className="space-y-4">
        <div className="grid gap-4 rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] p-5 md:grid-cols-2">
          <label className="block space-y-1.5 md:col-span-2">
            <span className="text-sm font-medium">Subject</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block space-y-1.5 md:col-span-2">
            <span className="text-sm font-medium">Preheader (optional)</span>
            <input
              value={preheader}
              onChange={(e) => setPreheader(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Delay after previous step (minutes)</span>
            <input
              type="number"
              min={0}
              value={delayMinutes}
              onChange={(e) => setDelayMinutes(Number(e.target.value) || 0)}
              className={inputCls}
            />
          </label>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[--color-muted-fg]">
            Email body
          </h2>
          <BlockEditor value={content} onChange={setContent} />
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
          <Button onClick={save} disabled={pending} className="w-full">
            <Save className="h-4 w-4" /> {pending ? "Saving…" : "Save step"}
          </Button>
        </div>
      </aside>
    </div>
  );
}

const inputCls =
  "w-full rounded-[--radius-md] border border-[--color-input] bg-[--color-bg] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-ring]";
