"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { submitPartnerInquiryAction } from "./actions";

const inputCls =
  "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm transition focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--token-primary)/0.20)]";
const selectCls =
  "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm transition focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--token-primary)/0.20)] appearance-none";
const labelCls = "block text-sm font-medium text-[var(--color-fg)] mb-1.5";

export function PartnerInquiryForm() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        await submitPartnerInquiryAction(fd);
        setSent(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit inquiry. Please try again.");
      }
    });
  }

  if (sent) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgb(var(--token-success)/0.10)]">
            <CheckCircle2 className="h-8 w-8 text-[var(--color-success)]" />
          </div>
          <h3 className="mt-4 text-xl font-bold text-[var(--color-fg)]">Inquiry Submitted</h3>
          <p className="mt-2 text-sm text-[var(--color-muted-fg)]">
            Thank you for your interest in partnering with us. Our partnerships team
            will review your inquiry and respond within 5 business days.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-sm">
      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-[rgb(var(--token-danger)/0.10)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="orgName" className={labelCls}>Organization Name *</label>
            <input id="orgName" name="organizationName" required className={inputCls} placeholder="Your organization" />
          </div>
          <div>
            <label htmlFor="contactName" className={labelCls}>Contact Person *</label>
            <input id="contactName" name="contactName" required className={inputCls} placeholder="Full name" />
          </div>
          <div>
            <label htmlFor="email" className={labelCls}>Email *</label>
            <input id="email" name="email" type="email" required className={inputCls} placeholder="contact@org.com" />
          </div>
          <div>
            <label htmlFor="phone" className={labelCls}>Phone</label>
            <input id="phone" name="phone" type="tel" className={inputCls} placeholder="+1 (555) 000-0000" />
          </div>
        </div>
        <div>
          <label htmlFor="website" className={labelCls}>Organization Website</label>
          <input id="website" name="website" type="url" className={inputCls} placeholder="https://yourorg.com" />
        </div>
        <div>
          <label htmlFor="partnershipType" className={labelCls}>Partnership Type *</label>
          <select id="partnershipType" name="partnershipType" required className={selectCls}>
            <option value="">Select type...</option>
            <option value="Funding">Funding Partnership</option>
            <option value="Implementation">Implementation Partnership</option>
            <option value="Technical">Technical Assistance</option>
            <option value="Strategic">Strategic Alliance</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="description" className={labelCls}>About Your Organization *</label>
          <textarea id="description" name="description" rows={3} required className={inputCls}
            placeholder="Brief description of your organization, mission, and areas of work..." />
        </div>
        <div>
          <label htmlFor="message" className={labelCls}>Why Partner With Us? *</label>
          <textarea id="message" name="message" rows={4} required className={inputCls}
            placeholder="Describe the partnership you envision — what you hope to achieve together, areas of mutual interest, and how this aligns with your organization's goals..." />
        </div>
        <button type="submit" disabled={isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-3.5 text-sm font-semibold text-white transition hover:shadow-lg disabled:opacity-60 sm:w-auto">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {isPending ? "Submitting..." : "Submit Partnership Inquiry"}
        </button>
      </form>
    </div>
  );
}
