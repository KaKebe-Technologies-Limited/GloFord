import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  MapPin,
  Clock,
  Building2,
  Heart,
  Users,
  Globe,
  ArrowRight,
} from "lucide-react";
import { getActiveVolunteerOpportunities } from "@/lib/services/volunteer";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { AnimatedCounter } from "@/components/motion/AnimatedCounter";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";
const DEFAULT_OG = `${APP_URL}/seed-images/gloford/hero-community.jpg`;

export const metadata: Metadata = {
  title: "Volunteer",
  description:
    "Give your time and talent. Join our volunteer network and help build stronger communities across Uganda.",
  openGraph: {
    title: "Volunteer",
    description:
      "Give your time and talent. Join our volunteer network and help build stronger communities across Uganda.",
    type: "website",
    url: `${APP_URL}/volunteer`,
    images: [{ url: DEFAULT_OG, width: 1200, height: 630, alt: "Gloford Foundation" }],
  },
  twitter: { card: "summary_large_image", title: "Volunteer" },
};

export default async function VolunteerPage() {
  const t = await getTranslations("public.volunteer");
  const opportunities = await getActiveVolunteerOpportunities();

  return (
    <>
      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-[rgb(248_250_249)] to-[rgb(240_247_244)] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="relative mx-auto max-w-7xl text-center">
          <ScrollReveal>
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              {t("eyebrow")}
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-[var(--color-fg)] sm:text-5xl lg:text-6xl">
              {t("heading")}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[var(--color-muted-fg)]">
              {t("subheading")}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Stats */}
      <section className="w-full bg-[var(--color-bg)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: "250+", label: t("statActiveVolunteers"), icon: Users },
              { value: "14", label: t("statProgramAreas"), icon: Building2 },
              { value: "40+", label: t("statCommunitiesReached"), icon: Globe },
              { value: "5,000+", label: t("statLivesImpacted"), icon: Heart },
            ].map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 0.08}>
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[rgb(var(--token-primary)/0.10)]">
                    <stat.icon className="h-6 w-6 text-[var(--color-primary)]" />
                  </div>
                  <AnimatedCounter
                    value={stat.value}
                    className="mt-3 block font-display text-3xl font-bold text-[var(--color-fg)]"
                  />
                  <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
                    {stat.label}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Opportunities */}
      <section className="w-full bg-[rgb(248_250_249)] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <h2 className="text-center font-display text-3xl font-bold tracking-tight text-[var(--color-fg)] sm:text-4xl">
              {t("opportunitiesHeading")}
            </h2>
            <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-[var(--color-primary)]" />
          </ScrollReveal>

          {opportunities.length === 0 ? (
            <ScrollReveal>
              <div className="mt-16 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[rgb(var(--token-primary)/0.10)]">
                  <Heart className="h-10 w-10 text-[var(--color-primary)]" />
                </div>
                <h3 className="mt-6 font-display text-xl font-semibold text-[var(--color-fg)]">
                  {t("noOpportunities")}
                </h3>
                <p className="mx-auto mt-2 max-w-md text-[var(--color-muted-fg)]">
                  {t("noOpportunitiesDesc")}
                </p>
              </div>
            </ScrollReveal>
          ) : (
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {opportunities.map((opp, i) => (
                <ScrollReveal key={opp.id} delay={i * 0.06}>
                  <div className="group flex h-full flex-col rounded-2xl border border-[var(--color-border)] bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-lg font-bold text-[var(--color-fg)]">
                        {opp.title}
                      </h3>
                      <span className="shrink-0 rounded-full bg-[rgb(var(--token-primary)/0.10)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-primary)]">
                        {opp.department}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--color-muted-fg)]">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {opp.location}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {opp.commitment}
                      </span>
                    </div>
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-[var(--color-muted-fg)]">
                      {opp.description.length > 160
                        ? opp.description.slice(0, 160) + "..."
                        : opp.description}
                    </p>
                    <Link
                      href={`/volunteer/${opp.slug}/apply`}
                      className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:text-[rgb(var(--token-primary)/0.80)]"
                    >
                      {t("apply")} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="w-full bg-[var(--color-bg)] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <ScrollReveal>
            <h2 className="font-display text-3xl font-bold tracking-tight text-[var(--color-fg)] sm:text-4xl">
              {t("ctaHeading")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[var(--color-muted-fg)]">
              {t("ctaDesc")}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/donate"
                className="inline-flex items-center rounded-full border border-[var(--color-border)] px-8 py-3 text-sm font-semibold transition-colors hover:bg-[rgb(var(--token-muted)/0.30)]"
              >
                {t("donateInstead")}
              </Link>
              <Link
                href="/careers"
                className="inline-flex items-center rounded-full border border-[var(--color-border)] px-8 py-3 text-sm font-semibold transition-colors hover:bg-[rgb(var(--token-muted)/0.30)]"
              >
                {t("viewCareers")}
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
