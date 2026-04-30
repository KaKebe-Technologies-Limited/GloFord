import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCareerBySlug } from "@/lib/services/careers";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import {
  Briefcase,
  MapPin,
  Clock,
  CalendarDays,
  DollarSign,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Star,
} from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  VOLUNTEER: "Volunteer",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const career = await getCareerBySlug(slug);
    return {
      title: `${career.title} — Careers`,
      description: `${career.title} in ${career.department} at ${career.location}.`,
    };
  } catch {
    return {};
  }
}

export default async function CareerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let career;
  try {
    career = await getCareerBySlug(slug);
  } catch {
    notFound();
  }

  const deadlinePassed =
    career.applicationDeadline &&
    new Date(career.applicationDeadline) < new Date();

  const requirements = Array.isArray(career.requirements) ? (career.requirements as string[]) : [];
  const responsibilities = Array.isArray(career.responsibilities) ? (career.responsibilities as string[]) : [];
  const qualifications = Array.isArray(career.qualifications) ? (career.qualifications as string[]) : [];
  const benefits = Array.isArray(career.benefits) ? (career.benefits as string[]) : [];

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[rgb(248_250_249)] via-white to-[rgb(240_247_244)] py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <Link
              href="/careers"
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--color-primary)] hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> All Careers
            </Link>
            <h1 className="font-display text-3xl font-bold text-[var(--color-fg)] sm:text-4xl">
              {career.title}
            </h1>
            <div className="mt-4 flex flex-wrap gap-3">
              {[
                { icon: Briefcase, text: career.department },
                { icon: MapPin, text: career.location },
                { icon: Clock, text: TYPE_LABELS[career.type] ?? career.type },
                career.salaryRange ? { icon: DollarSign, text: career.salaryRange } : null,
                career.applicationDeadline
                  ? {
                      icon: CalendarDays,
                      text: `Deadline: ${new Date(career.applicationDeadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
                    }
                  : null,
              ]
                .filter((b): b is { icon: typeof Briefcase; text: string } => b !== null)
                .map((badge, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm text-[var(--color-muted-fg)]"
                  >
                    <badge.icon className="h-4 w-4" />
                    {badge.text}
                  </span>
                ))}
            </div>

            {!deadlinePassed && (
              <Link
                href={`/careers/${slug}/apply`}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white transition hover:shadow-lg"
              >
                Apply Now <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            {deadlinePassed && (
              <p className="mt-6 rounded-xl border border-[rgb(var(--token-danger)/0.20)] bg-red-50 px-4 py-3 text-sm text-[var(--color-danger)]">
                Applications for this position are closed.
              </p>
            )}
          </ScrollReveal>
        </div>
      </section>

      {/* Description */}
      <section className="bg-[var(--color-bg)] py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <h2 className="font-display text-2xl font-bold text-[var(--color-fg)]">About This Role</h2>
            <p className="mt-4 whitespace-pre-line text-[var(--color-muted-fg)] leading-relaxed">
              {career.description}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Responsibilities */}
      {responsibilities.length > 0 && (
        <section className="bg-[rgb(248_250_249)] py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <ListSection title="Responsibilities" items={responsibilities} />
          </div>
        </section>
      )}

      {/* Requirements */}
      {requirements.length > 0 && (
        <section className="bg-[var(--color-bg)] py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <ListSection title="Requirements" items={requirements} />
          </div>
        </section>
      )}

      {/* Qualifications */}
      {qualifications.length > 0 && (
        <section className="bg-[rgb(248_250_249)] py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <ListSection title="Qualifications" items={qualifications} />
          </div>
        </section>
      )}

      {/* Benefits */}
      {benefits.length > 0 && (
        <section className="bg-gradient-to-br from-[rgb(240_247_244)] to-[rgb(230_242_236)] py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <ListSection title="Benefits" items={benefits} icon={Star} />
          </div>
        </section>
      )}

      {/* Apply CTA */}
      {!deadlinePassed && (
        <section className="bg-[var(--color-bg)] py-16">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <ScrollReveal>
              <h2 className="font-display text-3xl font-bold text-[var(--color-fg)]">
                Ready to Apply?
              </h2>
              <p className="mt-4 text-[var(--color-muted-fg)]">
                Submit your application and take the first step toward making a
                meaningful impact.
              </p>
              <Link
                href={`/careers/${slug}/apply`}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-3.5 text-sm font-semibold text-white transition hover:shadow-lg"
              >
                Apply for This Position <ArrowRight className="h-4 w-4" />
              </Link>
            </ScrollReveal>
          </div>
        </section>
      )}
    </>
  );
}

function ListSection({
  title,
  items,
  icon: Icon = CheckCircle2,
}: {
  title: string;
  items: string[];
  icon?: typeof CheckCircle2;
}) {
  return (
    <ScrollReveal>
      <h3 className="font-display text-xl font-bold text-[var(--color-fg)]">{title}</h3>
      <ul className="mt-4 space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--color-primary)]" />
            <span className="text-sm leading-relaxed text-[var(--color-muted-fg)]">{item}</span>
          </li>
        ))}
      </ul>
    </ScrollReveal>
  );
}
