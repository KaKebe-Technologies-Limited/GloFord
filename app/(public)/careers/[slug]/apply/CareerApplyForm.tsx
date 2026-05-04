"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  Briefcase,
  MapPin,
  Building2,
} from "lucide-react";
import { submitApplicationAction } from "./actions";

type Education = { institution: string; degree: string; field: string; year: string };
type Experience = { company: string; role: string; duration: string; description: string };

const EMPTY_EDUCATION: Education = { institution: "", degree: "", field: "", year: "" };
const EMPTY_EXPERIENCE: Experience = { company: "", role: "", duration: "", description: "" };

const inputCls =
  "w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm transition focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--token-primary)/0.20)]";
const labelCls = "block text-sm font-medium text-[var(--color-fg)] mb-1.5";

export function CareerApplyForm({
  slug,
  jobTitle,
  department,
  location,
  type,
  requirements,
}: {
  slug: string;
  jobTitle: string;
  department: string;
  location: string;
  type: string;
  requirements: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [education, setEducation] = useState<Education[]>([{ ...EMPTY_EDUCATION }]);
  const [experience, setExperience] = useState<Experience[]>([{ ...EMPTY_EXPERIENCE }]);

  const typeLabel = type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("slug", slug);
    fd.set("education", JSON.stringify(education.filter((ed) => ed.institution)));
    fd.set("experience", JSON.stringify(experience.filter((ex) => ex.company)));

    startTransition(async () => {
      try {
        await submitApplicationAction(fd);
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit application. Please try again.");
      }
    });
  }

  if (success) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center px-4 py-20">
        <ScrollReveal>
          <div className="max-w-lg text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgb(var(--token-success)/0.10)]">
              <CheckCircle2 className="h-8 w-8 text-[var(--color-success)]" />
            </div>
            <h1 className="mt-6 font-display text-3xl font-bold text-[var(--color-fg)]">
              Application Submitted
            </h1>
            <p className="mt-3 text-[var(--color-muted-fg)]">
              Thank you for applying to <strong>{jobTitle}</strong>. We will review
              your application and get back to you soon.
            </p>
            <Link
              href="/careers"
              className="mt-8 inline-flex items-center rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white transition hover:shadow-lg"
            >
              Back to Careers
            </Link>
          </div>
        </ScrollReveal>
      </section>
    );
  }

  return (
    <>
      {/* Job header */}
      <section className="bg-gradient-to-br from-[rgb(248_250_249)] to-[rgb(240_247_244)] py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Link
            href={`/careers/${slug}`}
            className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--color-primary)] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to job details
          </Link>
          <h1 className="font-display text-3xl font-bold text-[var(--color-fg)]">
            Apply for: {jobTitle}
          </h1>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--color-muted-fg)]">
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" /> {department}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {location}
            </span>
            <span className="flex items-center gap-1.5">
              <Briefcase className="h-4 w-4" /> {typeLabel}
            </span>
          </div>

          {requirements.length > 0 && (
            <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-white p-4">
              <p className="mb-2 text-sm font-semibold text-[var(--color-fg)]">Key Requirements</p>
              <ul className="space-y-1 text-sm text-[var(--color-muted-fg)]">
                {requirements.slice(0, 4).map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--color-primary)]" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Form */}
      <section className="bg-[var(--color-bg)] py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-10">
            {error && (
              <p role="alert" className="rounded-lg bg-[rgb(var(--token-danger)/0.10)] px-4 py-3 text-sm text-[var(--color-danger)]">
                {error}
              </p>
            )}
            {/* Personal info */}
            <div>
              <h2 className="mb-6 text-lg font-bold text-[var(--color-fg)]">Personal Information</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className={labelCls}>First Name *</label>
                  <input id="firstName" name="firstName" required className={inputCls} />
                </div>
                <div>
                  <label htmlFor="lastName" className={labelCls}>Last Name *</label>
                  <input id="lastName" name="lastName" required className={inputCls} />
                </div>
                <div>
                  <label htmlFor="email" className={labelCls}>Email *</label>
                  <input id="email" name="email" type="email" required className={inputCls} />
                </div>
                <div>
                  <label htmlFor="phone" className={labelCls}>Phone</label>
                  <input id="phone" name="phone" type="tel" className={inputCls} />
                </div>
              </div>
            </div>

            {/* Education */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--color-fg)]">Education</h2>
                <button
                  type="button"
                  onClick={() => setEducation((prev) => [...prev, { ...EMPTY_EDUCATION }])}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)]"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>
              {education.map((ed, i) => (
                <div key={i} className="mb-4 rounded-xl border border-[var(--color-border)] bg-white p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--color-muted-fg)]">Entry {i + 1}</span>
                    {education.length > 1 && (
                      <button type="button" onClick={() => setEducation((p) => p.filter((_, j) => j !== i))}
                        className="text-[var(--color-danger)]">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input placeholder="Institution" value={ed.institution}
                      onChange={(e) => { const arr = [...education]; arr[i] = { ...ed, institution: e.target.value }; setEducation(arr); }}
                      className={inputCls} />
                    <input placeholder="Degree" value={ed.degree}
                      onChange={(e) => { const arr = [...education]; arr[i] = { ...ed, degree: e.target.value }; setEducation(arr); }}
                      className={inputCls} />
                    <input placeholder="Field of Study" value={ed.field}
                      onChange={(e) => { const arr = [...education]; arr[i] = { ...ed, field: e.target.value }; setEducation(arr); }}
                      className={inputCls} />
                    <input placeholder="Graduation Year" value={ed.year}
                      onChange={(e) => { const arr = [...education]; arr[i] = { ...ed, year: e.target.value }; setEducation(arr); }}
                      className={inputCls} />
                  </div>
                </div>
              ))}
            </div>

            {/* Experience */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--color-fg)]">Work Experience</h2>
                <button
                  type="button"
                  onClick={() => setExperience((prev) => [...prev, { ...EMPTY_EXPERIENCE }])}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)]"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>
              {experience.map((ex, i) => (
                <div key={i} className="mb-4 rounded-xl border border-[var(--color-border)] bg-white p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--color-muted-fg)]">Entry {i + 1}</span>
                    {experience.length > 1 && (
                      <button type="button" onClick={() => setExperience((p) => p.filter((_, j) => j !== i))}
                        className="text-[var(--color-danger)]">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input placeholder="Company" value={ex.company}
                      onChange={(e) => { const arr = [...experience]; arr[i] = { ...ex, company: e.target.value }; setExperience(arr); }}
                      className={inputCls} />
                    <input placeholder="Role" value={ex.role}
                      onChange={(e) => { const arr = [...experience]; arr[i] = { ...ex, role: e.target.value }; setExperience(arr); }}
                      className={inputCls} />
                    <input placeholder="Duration (e.g. 2 years)" value={ex.duration}
                      onChange={(e) => { const arr = [...experience]; arr[i] = { ...ex, duration: e.target.value }; setExperience(arr); }}
                      className={inputCls} />
                    <textarea placeholder="Description" rows={2} value={ex.description}
                      onChange={(e) => { const arr = [...experience]; arr[i] = { ...ex, description: e.target.value }; setExperience(arr); }}
                      className={inputCls} />
                  </div>
                </div>
              ))}
            </div>

            {/* Additional */}
            <div>
              <h2 className="mb-6 text-lg font-bold text-[var(--color-fg)]">Additional Information</h2>
              <div className="space-y-5">
                <div>
                  <label htmlFor="coverLetter" className={labelCls}>Cover Letter</label>
                  <textarea id="coverLetter" name="coverLetter" rows={5}
                    placeholder="Tell us why you're a great fit for this role..."
                    className={inputCls} />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="resumeUrl" className={labelCls}>Resume URL</label>
                    <input id="resumeUrl" name="resumeUrl" type="url" placeholder="Google Drive / Dropbox link"
                      className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="linkedinUrl" className={labelCls}>LinkedIn Profile</label>
                    <input id="linkedinUrl" name="linkedinUrl" type="url" placeholder="https://linkedin.com/in/..."
                      className={inputCls} />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white transition hover:shadow-lg disabled:opacity-50 sm:w-auto"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isPending ? "Submitting..." : `Apply for ${jobTitle}`}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
