import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { listPublishedPrograms } from "@/lib/services/programs";
import { getActiveSiteStats } from "@/lib/services/siteStats";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { AnimatedCounter } from "@/components/motion/AnimatedCounter";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { collectionPageJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";

export const metadata: Metadata = {
  title: "Our Programs",
  description: "Explore our community development programs in education, healthcare, and sustainable livelihoods.",
  openGraph: {
    title: "Our Programs",
    description: "Explore our community development programs in education, healthcare, and sustainable livelihoods.",
    type: "website",
    url: `${APP_URL}/programs`,
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Gloford" }],
  },
  twitter: { card: "summary_large_image", title: "Our Programs" },
};

export default async function ProgramsPage() {
  const t = await getTranslations("public.programs");
  const [programs, stats] = await Promise.all([
    listPublishedPrograms(),
    getActiveSiteStats(),
  ]);

  return (
    <>
      <JsonLd
        data={[
          collectionPageJsonLd({
            name: "Our Programs",
            path: "/programs",
            description: "Explore our community development programs in education, healthcare, and sustainable livelihoods.",
          }),
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Programs", href: "/programs" },
          ]),
        ]}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[rgb(248_250_249)] via-white to-[rgb(240_247_244)] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <ScrollReveal>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              {t("eyebrow")}
            </p>
            <h1 className="font-display text-4xl font-bold text-[var(--color-fg)] sm:text-5xl">
              {t("heading")}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-[var(--color-muted-fg)]">
              {t("subheading")}
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
                    <AnimatedCounter
                      value={stat.value}
                      className="block text-3xl font-bold text-[var(--color-primary)]"
                    />
                    <p className="mt-1 text-sm text-[var(--color-muted-fg)]">{stat.label}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Programs Grid */}
      <section className="bg-[var(--color-bg)] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {programs.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-lg text-[var(--color-muted-fg)]">
                {t("empty")}
              </p>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {programs.map((p, i) => (
                <ScrollReveal key={p.id} delay={i * 0.1}>
                  <Link
                    href={`/programs/${p.slug}`}
                    className="group block overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white transition hover:shadow-xl"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-muted)]">
                      {p.cover?.url ? (
                        <Image
                          src={p.cover.url}
                          alt={p.cover.alt ?? p.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-[rgb(240_247_244)] to-[rgb(220_237_230)]">
                          <span className="text-4xl font-bold text-[rgb(var(--token-primary)/0.20)]">
                            {p.title.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h2 className="text-lg font-bold text-[var(--color-fg)] group-hover:text-[var(--color-primary)]">
                        {p.title}
                      </h2>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--color-muted-fg)]">
                        {p.summary}
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)]">
                        {t("learnMore")} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
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
              {t("ctaHeading")}
            </h2>
            <p className="mt-4 text-[var(--color-muted-fg)]">
              {t("ctaDesc")}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/donate"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white transition hover:shadow-lg"
              >
                {t("ctaDonate")}
              </Link>
              <Link
                href="/get-involved"
                className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white"
              >
                {t("ctaGetInvolved")}
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
