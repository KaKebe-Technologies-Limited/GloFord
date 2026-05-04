import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import {
  ArrowRight,
  Search,
  PenTool,
  Rocket,
  BarChart3,
  Heart,
  Users,
  Shield,
  Lightbulb,
} from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";

export const metadata: Metadata = {
  title: "Our Approach",
  description:
    "Learn about our methodology, principles, and approach to sustainable community development.",
  openGraph: {
    title: "Our Approach",
    description:
      "Learn about our methodology, principles, and approach to sustainable community development.",
    type: "website",
    url: `${APP_URL}/our-approach`,
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Gloford" }],
  },
  twitter: { card: "summary_large_image", title: "Our Approach" },
};

export default async function OurApproachPage() {
  const t = await getTranslations("public.ourApproach");

  const steps = [
    {
      icon: Search,
      titleKey: "stepAssessTitle" as const,
      descKey: "stepAssessDesc" as const,
      color: "from-blue-500 to-blue-600",
      step: "01",
    },
    {
      icon: PenTool,
      titleKey: "stepDesignTitle" as const,
      descKey: "stepDesignDesc" as const,
      color: "from-emerald-500 to-emerald-600",
      step: "02",
    },
    {
      icon: Rocket,
      titleKey: "stepImplementTitle" as const,
      descKey: "stepImplementDesc" as const,
      color: "from-amber-500 to-amber-600",
      step: "03",
    },
    {
      icon: BarChart3,
      titleKey: "stepEvaluateTitle" as const,
      descKey: "stepEvaluateDesc" as const,
      color: "from-rose-500 to-rose-600",
      step: "04",
    },
  ];

  const principles = [
    {
      icon: Heart,
      titleKey: "principleCommunityTitle" as const,
      descKey: "principleCommunityDesc" as const,
    },
    {
      icon: Users,
      titleKey: "principlePartnershipTitle" as const,
      descKey: "principlePartnershipDesc" as const,
    },
    {
      icon: Shield,
      titleKey: "principleAccountabilityTitle" as const,
      descKey: "principleAccountabilityDesc" as const,
    },
    {
      icon: Lightbulb,
      titleKey: "principleInnovationTitle" as const,
      descKey: "principleInnovationDesc" as const,
    },
  ];

  const stats = [
    { value: "15+", labelKey: "statYears" as const },
    { value: "50K+", labelKey: "statLives" as const },
    { value: "120+", labelKey: "statPartners" as const },
    { value: "98%", labelKey: "statCompletion" as const },
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: t("heading"), href: "/our-approach" },
        ])}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[rgb(248_250_249)] to-[rgb(240_247_244)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
                {t("heroEyebrow")}
              </p>
              <h1 className="font-display text-4xl font-bold text-[var(--color-fg)] sm:text-5xl lg:text-6xl">
                {t("heading")}
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-[var(--color-muted-fg)]">
                {t("heroDesc")}
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Methodology */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mb-16 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
                {t("methodologyEyebrow")}
              </p>
              <h2 className="font-display text-3xl font-bold text-[var(--color-fg)] sm:text-4xl">
                {t("methodologyHeading")}
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <ScrollReveal key={step.titleKey} delay={i * 0.1}>
                <div className="group relative rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-sm transition hover:shadow-xl">
                  <span className="absolute -top-4 right-6 rounded-full bg-[rgb(var(--token-primary)/0.10)] px-3 py-1 text-sm font-bold text-[var(--color-primary)]">
                    {step.step}
                  </span>
                  <div
                    className={`mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${step.color} shadow-lg`}
                  >
                    <step.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-[var(--color-fg)]">
                    {t(step.titleKey)}
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--color-muted-fg)]">
                    {t(step.descKey)}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Connection line (decorative, visible on lg) */}
          <div className="relative mx-auto mt-8 hidden h-1 max-w-5xl lg:block">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-200 via-emerald-200 via-amber-200 to-rose-200 rounded-full" />
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="bg-[rgb(248_250_249)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mb-16 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
                {t("principlesEyebrow")}
              </p>
              <h2 className="font-display text-3xl font-bold text-[var(--color-fg)] sm:text-4xl">
                {t("principlesHeading")}
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid gap-8 sm:grid-cols-2">
            {principles.map((p, i) => (
              <ScrollReveal key={p.titleKey} delay={i * 0.1}>
                <div className="flex gap-5 rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-sm transition hover:shadow-xl">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--token-primary)/0.10)]">
                    <p.icon className="h-7 w-7 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--color-fg)]">
                      {t(p.titleKey)}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-fg)]">
                      {t(p.descKey)}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gradient-to-br from-[rgb(240_247_244)] via-white to-[rgb(248_250_249)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mb-14 text-center">
              <h2 className="font-display text-3xl font-bold text-[var(--color-fg)] sm:text-4xl">
                {t("impactHeading")}
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, i) => (
              <ScrollReveal key={stat.labelKey} delay={i * 0.1}>
                <div className="text-center">
                  <span className="block text-4xl font-bold text-[var(--color-primary)] sm:text-5xl">
                    {stat.value}
                  </span>
                  <p className="mt-2 text-sm font-medium text-[var(--color-muted-fg)]">
                    {t(stat.labelKey)}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold text-[var(--color-fg)] sm:text-4xl">
                {t("ctaHeading")}
              </h2>
              <p className="mt-4 text-lg text-[var(--color-muted-fg)]">
                {t("ctaDesc")}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link
                  href="/donate"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-7 py-3 text-sm font-semibold text-white transition hover:shadow-lg"
                >
                  <Heart className="h-4 w-4" /> {t("ctaDonate")}
                </Link>
                <Link
                  href="/volunteer"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-primary)] px-7 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white"
                >
                  {t("ctaGetInvolved")} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
