"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, MapPin, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { submitVolunteerApplicationAction } from "./actions";

const inputCls =
  "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm transition focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--token-primary)/0.20)]";

const AVAILABILITY_OPTIONS = [
  { value: "weekdays", label: "Weekdays" },
  { value: "weekends", label: "Weekends" },
  { value: "evenings", label: "Evenings" },
  { value: "flexible", label: "Flexible" },
] as const;

export function VolunteerApplyForm({
  opportunityId,
  opportunityTitle,
  opportunityDepartment,
  opportunityLocation,
  opportunityCommitment,
  slug,
}: {
  opportunityId: string;
  opportunityTitle: string;
  opportunityDepartment: string;
  opportunityLocation: string;
  opportunityCommitment: string;
  slug: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    try {
      formData.set("opportunityId", opportunityId);
      await submitVolunteerApplicationAction(formData);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit application. Please try again.");
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[rgb(var(--token-primary)/0.10)]">
          <CheckCircle2 className="h-10 w-10 text-[var(--color-primary)]" />
        </div>
        <h2 className="mt-6 font-display text-2xl font-bold text-[var(--color-fg)]">
          Application Submitted
        </h2>
        <p className="mt-3 text-[var(--color-muted-fg)]">
          Thank you for your interest in volunteering as{" "}
          <strong>{opportunityTitle}</strong>. We will review your application
          and get back to you soon.
        </p>
        <Link
          href="/volunteer"
          className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] hover:text-[rgb(var(--token-primary)/0.80)]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Opportunities
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link
        href={`/volunteer/${slug}`}
        className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Details
      </Link>

      {/* Opportunity summary */}
      <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <h1 className="font-display text-xl font-bold text-[var(--color-fg)]">
          {opportunityTitle}
        </h1>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--color-muted-fg)]">
          <span className="inline-flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" /> {opportunityDepartment}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {opportunityLocation}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {opportunityCommitment}
          </span>
        </div>
      </div>

      {/* Application form */}
      <form
        action={handleSubmit}
        className="mt-6 space-y-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6"
      >
        <h2 className="font-display text-lg font-bold text-[var(--color-fg)]">
          Your Application
        </h2>
        {error && (
          <p role="alert" className="rounded-lg bg-[rgb(var(--token-danger)/0.10)] px-3 py-2 text-sm text-[var(--color-danger)]">
            {error}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="firstName"
              className="text-sm font-medium text-[var(--color-fg)]"
            >
              First Name *
            </label>
            <input
              id="firstName"
              name="firstName"
              required
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="lastName"
              className="text-sm font-medium text-[var(--color-fg)]"
            >
              Last Name *
            </label>
            <input
              id="lastName"
              name="lastName"
              required
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium text-[var(--color-fg)]"
            >
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="phone"
              className="text-sm font-medium text-[var(--color-fg)]"
            >
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className={inputCls}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="motivation"
            className="text-sm font-medium text-[var(--color-fg)]"
          >
            Motivation *
          </label>
          <textarea
            id="motivation"
            name="motivation"
            required
            rows={4}
            placeholder="Tell us why you want to volunteer and what drives your interest..."
            className="flex w-full rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm placeholder:text-[var(--color-muted-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="availability"
            className="text-sm font-medium text-[var(--color-fg)]"
          >
            Availability
          </label>
          <select
            id="availability"
            name="availability"
            className="flex h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
          >
            <option value="">Select availability...</option>
            {AVAILABILITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="skills"
            className="text-sm font-medium text-[var(--color-fg)]"
          >
            Skills
          </label>
          <input
            id="skills"
            name="skills"
            placeholder="e.g. teaching, data analysis, project management"
            className={inputCls}
          />
          <p className="text-xs text-[var(--color-muted-fg)]">
            Comma-separated list of your relevant skills.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-[rgb(var(--token-primary)/0.90)] disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
            </>
          ) : (
            "Submit Application"
          )}
        </button>
      </form>
    </>
  );
}
