import type { Metadata } from "next";
import Link from "next/link";
import { getActiveCareers } from "@/lib/services/careers";
import { getActiveSiteStats } from "@/lib/services/siteStats";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { AnimatedCounter } from "@/components/motion/AnimatedCounter";
import { Briefcase, MapPin, Clock, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Careers",
  description: "Join our team and make a lasting impact. Explore open positions.",
};

const TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  VOLUNTEER: "Volunteer",
};

export default async function CareersPage() {
  const [careers, stats] = await Promise.all([
    getActiveCareers(),
    getActiveSiteStats(),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[rgb(248_250_249)] via-white to-[rgb(240_247_244)] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <ScrollReveal>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              Join Our Team
            </p>
            <h1 className="font-display text-4xl font-bold text-[var(--color-fg)] sm:text-5xl">
              Careers
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-[var(--color-muted-fg)]">
              We are always looking for passionate individuals who share our
              commitment to community development and social impact.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Stats */}
      {stats.length > 0 && (
        <section className="border-y border-[var(--color-border)] bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat, i) => (
                <ScrollReveal key={stat.id} delay={i * 0.1}>
                  <div className="text-center">
                    <AnimatedCounter value={stat.value} className="block text-3xl font-bold text-[var(--color-primary)]" />
                    <p className="mt-1 text-sm text-[var(--color-muted-fg)]">{stat.label}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Listings */}
      <section className="bg-[var(--color-bg)] py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <h2 className="font-display text-2xl font-bold text-[var(--color-fg)]">Open Positions</h2>
          </ScrollReveal>

          {careers.length === 0 ? (
            <ScrollReveal>
              <div className="mt-10 rounded-2xl border border-[var(--color-border)] bg-white p-12 text-center">
                <Briefcase className="mx-auto h-12 w-12 text-[rgb(var(--token-muted-fg)/0.30)]" />
                <h3 className="mt-4 text-xl font-bold text-[var(--color-fg)]">No openings right now</h3>
                <p className="mt-2 text-[var(--color-muted-fg)]">
                  Check back soon or reach out to us directly.
                </p>
              </div>
            </ScrollReveal>
          ) : (
            <div className="mt-8 space-y-4">
              {careers.map((career, i) => (
                <ScrollReveal key={career.id} delay={i * 0.05}>
                  <Link
                    href={`/careers/${career.slug}`}
                    className="group block rounded-2xl border border-[var(--color-border)] bg-white p-6 transition hover:shadow-xl hover:border-[rgb(var(--token-primary)/0.30)]"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-[var(--color-fg)] group-hover:text-[var(--color-primary)]">
                          {career.title}
                        </h3>
                        <div className="flex flex-wrap gap-3 text-sm text-[var(--color-muted-fg)]">
                          <span className="flex items-center gap-1.5">
                            <Briefcase className="h-3.5 w-3.5" /> {career.department}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" /> {career.location}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" /> {TYPE_LABELS[career.type] ?? career.type}
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] transition group-hover:gap-2.5">
                        View Details <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[rgb(240_247_244)] to-[rgb(230_242_236)] py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <ScrollReveal>
            <h2 className="font-display text-3xl font-bold text-[var(--color-fg)]">
              Don&apos;t See Your Role?
            </h2>
            <p className="mt-4 text-[var(--color-muted-fg)]">
              We&apos;re always looking for talented individuals. Send us your resume and
              we&apos;ll keep you in mind for future opportunities.
            </p>
            <Link
              href="/contact"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white transition hover:shadow-lg"
            >
              Get in Touch <ArrowRight className="h-4 w-4" />
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
