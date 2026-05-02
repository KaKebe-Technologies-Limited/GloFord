"use client";

import { useState, useTransition } from "react";
import { Send, Calendar, Trash2, FlaskConical } from "lucide-react";
import {
  createNewsletterAction,
  updateNewsletterAction,
  scheduleNewsletterAction,
  sendNewsletterAction,
  deleteNewsletterAction,
} from "@/lib/actions/newsletters";
import { sendTestEmailAction } from "@/lib/actions/newsletterTest";
import dynamic from "next/dynamic";

const BlockEditor = dynamic(
  () => import("@/components/blocks/BlockEditor").then((m) => ({ default: m.BlockEditor })),
  { ssr: false },
);
import { Button } from "@/components/ui/Button";
import type { Block } from "@/lib/blocks/types";
import type { NewsletterStatus } from "@prisma/client";

type SegmentOption = { id: string; name: string; slug: string };

type Initial = {
  id?: string;
  title?: string;
  subject?: string;
  preheader?: string;
  content?: Block[];
  segmentIds?: string[];
  status?: NewsletterStatus;
  scheduledAt?: string;
};

export function NewsletterForm({
  segments,
  initial,
}: {
  segments: SegmentOption[];
  initial?: Initial;
}) {
  const isEdit = !!initial?.id;
  const readOnly = initial?.status === "SENT" || initial?.status === "SENDING";
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [preheader, setPreheader] = useState(initial?.preheader ?? "");
  const [content, setContent] = useState<Block[]>(initial?.content ?? []);
  const [selectedSegments, setSelectedSegments] = useState<string[]>(initial?.segmentIds ?? []);
  const [scheduledAt, setScheduledAt] = useState(initial?.scheduledAt ?? "");
  const [testEmail, setTestEmail] = useState("");
  const [testSent, setTestSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const toggleSegment = (id: string) =>
    setSelectedSegments((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const save = () => {
    setError(null);
    start(async () => {
      try {
        const payload = {
          title,
          subject,
          preheader: preheader || undefined,
          content,
          segmentIds: selectedSegments,
        };
        if (isEdit) await updateNewsletterAction({ id: initial!.id!, ...payload });
        else await createNewsletterAction(payload);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
      }
    });
  };

  const schedule = () => {
    if (!initial?.id) return;
    start(async () => {
      try {
        await scheduleNewsletterAction({
          id: initial.id!,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to schedule");
      }
    });
  };

  const sendNow = () => {
    if (!initial?.id) return;
    if (!confirm("Send this newsletter to the selected audience now?")) return;
    start(async () => {
      try {
        await sendNewsletterAction({ id: initial.id! });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to send");
      }
    });
  };

  const sendTest = () => {
    if (!initial?.id || !testEmail) return;
    start(async () => {
      try {
        await sendTestEmailAction({ newsletterId: initial.id!, recipientEmail: testEmail });
        setTestSent(true);
        setTimeout(() => setTestSent(false), 3000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to send test");
      }
    });
  };

  const del = () => {
    if (!initial?.id) return;
    if (!confirm("Delete this draft newsletter?")) return;
    start(async () => {
      try {
        await deleteNewsletterAction({ id: initial.id! });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete");
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">Details</h2>
          <Field label="Internal title" hint="Not shown to recipients">
            <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={readOnly} className={inputCls} />
          </Field>
          <Field label="Subject line">
            <input value={subject} onChange={(e) => setSubject(e.target.value)} disabled={readOnly} className={inputCls} />
          </Field>
          <Field label="Preheader" hint="Preview text shown in the inbox">
            <input value={preheader} onChange={(e) => setPreheader(e.target.value)} disabled={readOnly} className={inputCls} />
          </Field>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">Content</h2>
          {readOnly ? (
            <p className="text-sm text-[var(--color-muted-fg)]">This newsletter has already been sent.</p>
          ) : (
            <BlockEditor value={content} onChange={setContent} />
          )}
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">Audience</h2>
          {segments.length === 0 ? (
            <p className="text-xs text-[var(--color-muted-fg)]">No segments yet. The newsletter will go to all active subscribers.</p>
          ) : (
            <ul className="space-y-1">
              {segments.map((s) => (
                <li key={s.id}>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      disabled={readOnly}
                      checked={selectedSegments.includes(s.id)}
                      onChange={() => toggleSegment(s.id)}
                    />
                    {s.name}
                  </label>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-[var(--color-muted-fg)]">
            {selectedSegments.length === 0
              ? "All active subscribers"
              : `${selectedSegments.length} segment${selectedSegments.length === 1 ? "" : "s"} selected`}
          </p>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 space-y-3">
          {error ? (
            <p role="alert" className="rounded-[var(--radius-sm)] bg-[rgb(var(--token-danger)/0.10)] p-2 text-sm text-[var(--color-danger)]">
              {error}
            </p>
          ) : null}

          <Button onClick={save} disabled={pending || readOnly} className="w-full">
            {pending ? "Saving\u2026" : isEdit ? "Save draft" : "Create newsletter"}
          </Button>

          {isEdit && !readOnly ? (
            <>
              {/* Test email */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-[var(--color-muted-fg)]">Send test email</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className={`flex-1 ${inputCls}`}
                  />
                  <Button onClick={sendTest} disabled={pending || !testEmail} variant="outline" size="md">
                    <FlaskConical className="h-4 w-4" />
                  </Button>
                </div>
                {testSent && (
                  <p className="text-xs text-[var(--color-success)]">Test sent!</p>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className={`flex-1 ${inputCls}`}
                />
                <Button onClick={schedule} disabled={pending} variant="outline" size="md">
                  <Calendar className="h-4 w-4" /> Schedule
                </Button>
              </div>
              <Button onClick={sendNow} disabled={pending} variant="secondary" className="w-full">
                <Send className="h-4 w-4" /> Send now
              </Button>
              <Button onClick={del} disabled={pending} variant="outline" className="w-full">
                <Trash2 className="h-4 w-4" /> Delete draft
              </Button>
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

const inputCls =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] disabled:opacity-60";

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
