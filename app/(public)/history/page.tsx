import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { AnimatedCounter } from "@/components/motion/AnimatedCounter";
import { getActiveSiteStats } from "@/lib/services/siteStats";
import { getActiveMilestones } from "@/lib/services/milestones";
import { getSiteImages } from "@/lib/services/siteImages";
import { ArrowRight, Calendar } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";

export const metadata: Metadata = {
  title: "Our History",
  description: "The story of our growth from a small community initiative to a regional force for change.",
  openGraph: {
    title: "Our History",
    description: "The story of our growth from a small community initiative to a regional force for change.",
    type: "website",
    url: `${APP_URL}/history`,
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Gloford" }],
  },
  twitter: { card: "summary_large_image", title: "Our History" },
};

const FALLBACK_IMG = "/seed-images/gloford/hero-community.jpg";

export default async function HistoryPage() {
  const [stats, t, milestones, siteImgs] = await Promise.all([
    getActiveSiteStats(),
    getTranslations("public.history"),
    getActiveMilestones(),
    getSiteImages(["history-hero-1", "history-hero-2"]),
  ]);

  const heroImg1 = siteImgs.get("history-hero-1")?.url ?? FALLBACK_IMG;
  const heroImg2 = siteImgs.get("history-hero-2")?.url ?? "/seed-images/gloford/hero-staff.jpg";

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: t("heading"), href: "/history" },
        ])}
      />

      {/* Hero */}
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
              <p className="mt-4 text-lg text-[var(--color-muted-fg)]">
                {t("subheading")}
              </p>
              <Link href="/who-we-are"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white transition hover:shadow-lg">
                {t("aboutUsCta")} <ArrowRight className="h-4 w-4" />
              </Link>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={heroImg1} alt={siteImgs.get("history-hero-1")?.alt ?? t("altEarlyDays")} className="h-full w-full object-cover" />
                </div>
                <div className="mt-8 relative aspect-[3/4] overflow-hidden rounded-2xl shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={heroImg2} alt={siteImgs.get("history-hero-2")?.alt ?? t("altToday")} className="h-full w-full object-cover" />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Stats */}
      {stats.length > 0 && (
        <section className="border-y border-[var(--color-border)] bg-[var(--color-card)] py-12">
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

      {/* Timeline */}
      <section className="bg-[var(--color-bg)] py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mb-14 text-center">
              <h2 className="font-display text-3xl font-bold text-[var(--color-fg)]">{t("milestones")}</h2>
            </div>
          </ScrollReveal>

          <div className="space-y-12">
            {milestones.map((ms, i) => (
              <ScrollReveal key={ms.id} delay={i * 0.05}>
                <div className={`flex flex-col gap-6 md:flex-row md:items-center md:gap-10 ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}>
                  {ms.imageUrl && (
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl shadow-lg md:w-2/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ms.imageUrl} alt={ms.title} className="h-full w-full object-cover" />
                      <div className="absolute left-4 top-4 rounded-full bg-[var(--color-primary)] px-4 py-1.5 text-sm font-bold text-white shadow-lg">
                        {ms.year}
                      </div>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--token-primary)/0.10)]">
                        <Calendar className="h-4 w-4 text-[var(--color-primary)]" />
                      </div>
                      <span className="text-sm font-semibold text-[var(--color-primary)]">{ms.year}</span>
                    </div>
                    <h3 className="text-xl font-bold text-[var(--color-fg)]">{ms.title}</h3>
                    <p className="mt-2 leading-relaxed text-[var(--color-muted-fg)]">{ms.description}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Looking forward */}
      <section className="bg-gradient-to-br from-[rgb(240_247_244)] to-[rgb(230_242_236)] py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <ScrollReveal>
            <h2 className="font-display text-3xl font-bold text-[var(--color-fg)]">{t("lookingForward")}</h2>
            <p className="mt-4 text-[var(--color-muted-fg)]">
              {t("lookingForwardDesc")}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/programs"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white transition hover:shadow-lg">
                {t("ourPrograms")}
              </Link>
              <Link href="/donate"
                className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white">
                {t("supportUs")}
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
