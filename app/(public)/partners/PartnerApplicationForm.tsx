"use client";

import { useState, useTransition } from "react";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { submitPartnerAction } from "./actions";

const inputCls =
  "w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm transition focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--token-primary)/0.20)]";
const selectCls =
  "w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm transition focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--token-primary)/0.20)] appearance-none";
const labelCls = "block text-sm font-medium mb-1.5";

const PARTNERSHIP_TYPES = [
  "Strategic",
  "Funding",
  "Technical",
  "Implementation",
];

export function PartnerApplicationForm() {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await submitPartnerAction(fd);
      setSuccess(true);
    });
  }

  if (success) {
    return (
      <ScrollReveal>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="mt-6 text-xl font-semibold">Application Submitted</h3>
          <p className="mt-2 text-[var(--color-muted-fg)]">
            Thank you for your interest in partnering with us. Our team will
            review your application and respond shortly.
          </p>
        </div>
      </ScrollReveal>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 sm:p-8"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="organizationName" className={labelCls}>
            Organization Name *
          </label>
          <input
            id="organizationName"
            name="organizationName"
            required
            className={inputCls}
            placeholder="Your organization"
          />
        </div>
        <div>
          <label htmlFor="contactName" className={labelCls}>
            Contact Name *
          </label>
          <input
            id="contactName"
            name="contactName"
            required
            className={inputCls}
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label htmlFor="partEmail" className={labelCls}>
            Email *
          </label>
          <input
            id="partEmail"
            name="email"
            type="email"
            required
            className={inputCls}
            placeholder="contact@org.com"
          />
        </div>
        <div>
          <label htmlFor="partPhone" className={labelCls}>
            Phone
          </label>
          <input
            id="partPhone"
            name="phone"
            type="tel"
            className={inputCls}
            placeholder="+256 700 000 000"
          />
        </div>
        <div>
          <label htmlFor="partWebsite" className={labelCls}>
            Website
          </label>
          <input
            id="partWebsite"
            name="website"
            type="url"
            className={inputCls}
            placeholder="https://..."
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="partnershipType" className={labelCls}>
            Partnership Type *
          </label>
          <div className="relative">
            <select
              id="partnershipType"
              name="partnershipType"
              required
              className={selectCls}
            >
              <option value="">Select type...</option>
              {PARTNERSHIP_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-fg)]" />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="partDescription" className={labelCls}>
            About Your Organization *
          </label>
          <textarea
            id="partDescription"
            name="description"
            required
            rows={4}
            className={inputCls}
            placeholder="Brief description of your organization and its mission..."
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="partMessage" className={labelCls}>
            Additional Message
          </label>
          <textarea
            id="partMessage"
            name="message"
            rows={3}
            className={inputCls}
            placeholder="How would you like to collaborate with us?"
          />
        </div>
      </div>
      <div className="mt-8 text-center">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white transition hover:shadow-lg disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Application"
          )}
        </button>
      </div>
    </form>
  );
}
