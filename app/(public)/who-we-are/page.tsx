import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { StatsBar } from "@/components/public/StatsBar";
import { getActiveTestimonials } from "@/lib/services/testimonials";
import { getActiveLeaderMessages } from "@/lib/services/leaderMessages";
import { getSiteImages } from "@/lib/services/siteImages";
import { TestimonialsSection } from "@/components/public/TestimonialsSection";
import { LeaderMessageSection } from "@/components/public/LeaderMessageSection";

// Fallbacks used only when no CMS images are set
const FALLBACK_IMAGES = {
  hero: "/seed-images/gloford/hero-community.jpg",
  story: "/seed-images/gloford/hero-field.jpg",
  team: "/seed-images/gloford/hero-staff.jpg",
  youth: "/seed-images/gloford/hero-youth.jpg",
  climate: "/seed-images/gloford/hero-climate.jpg",
};
import {
  ArrowRight,
  Target,
  Eye,
  Heart,
  Shield,
  Users,
  Sparkles,
} from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { nonprofitJsonLd, organizationJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";

export const metadata: Metadata = {
  title: "Who We Are",
  description:
    "Learn about our story, mission, vision, and the values that drive our work across communities.",
  openGraph: {
    title: "Who We Are",
    description:
      "Learn about our story, mission, vision, and the values that drive our work across communities.",
    type: "website",
    url: `${APP_URL}/who-we-are`,
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Gloford" }],
  },
  twitter: { card: "summary_large_image", title: "Who We Are" },
};

export default async function WhoWeArePage() {
  const t = await getTranslations("public.whoWeAre");
  const [testimonials, messages, siteImgs] = await Promise.all([
    getActiveTestimonials(),
    getActiveLeaderMessages(),
    getSiteImages([
      "who-we-are-hero",
      "who-we-are-story",
      "who-we-are-team",
      "who-we-are-youth",
      "who-we-are-climate",
    ]),
  ]);

  const IMAGES = {
    hero: siteImgs.get("who-we-are-hero")?.url ?? FALLBACK_IMAGES.hero,
    story: siteImgs.get("who-we-are-story")?.url ?? FALLBACK_IMAGES.story,
    team: siteImgs.get("who-we-are-team")?.url ?? FALLBACK_IMAGES.team,
    youth: siteImgs.get("who-we-are-youth")?.url ?? FALLBACK_IMAGES.youth,
    climate: siteImgs.get("who-we-are-climate")?.url ?? FALLBACK_IMAGES.climate,
  };

  return (
    <>
      <JsonLd
        data={[
          nonprofitJsonLd(),
          organizationJsonLd(),
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Who We Are", href: "/who-we-are" },
          ]),
        ]}
      />

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-[rgb(248_250_249)] via-white to-[rgb(240_247_244)] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <ScrollReveal>
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
                {t("eyebrow")}
              </p>
              <h1 className="font-display text-4xl font-bold text-[var(--color-fg)] sm:text-5xl">
                {t("heading")}
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-[var(--color-muted-fg)]">
                {t("subheading")}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/programs"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white transition hover:shadow-lg"
                >
                  {t("ourProgramsCta")} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/our-history"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white"
                >
                  {t("ourHistoryCta")}
                </Link>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={IMAGES.hero} alt={siteImgs.get("who-we-are-hero")?.alt ?? t("imageAltCommunity")} className="h-full w-full object-cover" />
                  </div>
                  <div className="relative aspect-square overflow-hidden rounded-2xl shadow-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={IMAGES.climate} alt={siteImgs.get("who-we-are-climate")?.alt ?? t("imageAltEnvironmental")} className="h-full w-full object-cover" />
                  </div>
                </div>
                <div className="mt-8 space-y-4">
                  <div className="relative aspect-square overflow-hidden rounded-2xl shadow-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={IMAGES.youth} alt={siteImgs.get("who-we-are-youth")?.alt ?? t("imageAltYouth")} className="h-full w-full object-cover" />
                  </div>
                  <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={IMAGES.team} alt={siteImgs.get("who-we-are-team")?.alt ?? t("imageAltTeam")} className="h-full w-full object-cover" />
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Our Story ── */}
      <section className="bg-[var(--color-bg)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
            <ScrollReveal>
              <div className="space-y-6">
                <p className="text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
                  {t("storyEyebrow")}
                </p>
                <h2 className="font-display text-3xl font-bold text-[var(--color-fg)] sm:text-4xl">
                  {t("storyHeading")}
                </h2>
                <div className="space-y-4 text-[var(--color-muted-fg)] leading-relaxed">
                  <p>{t("storyP1")}</p>
                  <p>{t("storyP2")}</p>
                  <p>{t("storyP3")}</p>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <div className="relative">
                <div className="aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={IMAGES.story}
                    alt={siteImgs.get("who-we-are-story")?.alt ?? t("imageAltJourney")}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 rounded-xl bg-[var(--color-primary)] p-5 text-white shadow-xl">
                  <p className="text-3xl font-bold">10+</p>
                  <p className="text-sm text-white/80">{t("yearsOfImpact")}</p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Mission & Vision ── */}
      <section className="bg-gradient-to-br from-[rgb(240_247_244)] via-[rgb(220_237_230)] to-[rgb(240_247_244)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            <ScrollReveal>
              <div className="rounded-2xl border border-[rgb(26_60_52/0.1)] bg-white p-10 shadow-sm">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-[rgb(var(--token-primary)/0.10)]">
                  <Target className="h-7 w-7 text-[var(--color-primary)]" />
                </div>
                <h3 className="mb-4 font-display text-2xl font-bold text-[var(--color-fg)]">
                  {t("missionHeading")}
                </h3>
                <p className="leading-relaxed text-[var(--color-muted-fg)]">
                  {t("missionText")}
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.15}>
              <div className="rounded-2xl border border-[rgb(26_60_52/0.1)] bg-white p-10 shadow-sm">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-[rgb(var(--token-accent)/0.10)]">
                  <Eye className="h-7 w-7 text-[var(--color-accent)]" />
                </div>
                <h3 className="mb-4 font-display text-2xl font-bold text-[var(--color-fg)]">
                  {t("visionHeading")}
                </h3>
                <p className="leading-relaxed text-[var(--color-muted-fg)]">
                  {t("visionText")}
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Core Values ── */}
      <section className="bg-[var(--color-bg)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mb-14 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
                {t("valuesEyebrow")}
              </p>
              <h2 className="font-display text-3xl font-bold text-[var(--color-fg)] sm:text-4xl">
                {t("valuesHeading")}
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Heart, title: t("valueCompassionTitle"), desc: t("valueCompassionDesc") },
              { icon: Shield, title: t("valueIntegrityTitle"), desc: t("valueIntegrityDesc") },
              { icon: Users, title: t("valueCommunityTitle"), desc: t("valueCommunityDesc") },
              { icon: Sparkles, title: t("valueInnovationTitle"), desc: t("valueInnovationDesc") },
            ].map((v, i) => (
              <ScrollReveal key={v.title} delay={i * 0.1}>
                <div className="group rounded-2xl border border-[var(--color-border)] p-8 text-center transition hover:border-[rgb(var(--token-primary)/0.30)] hover:shadow-lg">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--token-primary)/0.10)] transition group-hover:bg-[var(--color-primary)] group-hover:text-white">
                    <v.icon className="h-6 w-6 text-[var(--color-primary)] transition group-hover:text-white" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-[var(--color-fg)]">{v.title}</h3>
                  <p className="text-sm text-[var(--color-muted-fg)]">{v.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <StatsBar />

      {/* ── Leader Messages ── */}
      {messages.length > 0 && <LeaderMessageSection messages={messages} />}

      {/* ── Testimonials ── */}
      {testimonials.length > 0 && (
        <TestimonialsSection testimonials={testimonials} />
      )}

      {/* ── CTA ── */}
      <section className="bg-[rgb(var(--token-muted)/0.30)] py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <ScrollReveal>
            <h2 className="font-display text-3xl font-bold text-[var(--color-fg)] sm:text-4xl">
              {t("ctaHeading")}
            </h2>
            <p className="mt-4 text-[var(--color-muted-fg)]">
              {t("ctaDesc")}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/donate"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-3.5 text-sm font-semibold text-white transition hover:shadow-lg"
              >
                <Heart className="h-4 w-4" /> {t("ctaDonate")}
              </Link>
              <Link
                href="/get-involved"
                className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-primary)] px-8 py-3.5 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white"
              >
                {t("ctaGetInvolved")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
