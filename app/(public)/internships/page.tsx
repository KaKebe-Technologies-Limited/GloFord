import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Briefcase, MapPin, Clock, ArrowRight, GraduationCap } from "lucide-react";
import Image from "next/image";
import { JsonLd } from "@/components/seo/JsonLd";
import { collectionPageJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";

export const metadata: Metadata = {
  title: "Internships",
  description: "Gain real-world experience in community development. Explore our internship opportunities.",
  openGraph: {
    title: "Internships",
    description: "Gain real-world experience in community development. Explore our internship opportunities.",
    type: "website",
    url: `${APP_URL}/internships`,
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Gloford" }],
  },
  twitter: { card: "summary_large_image", title: "Internships" },
};

export default async function InternshipsPage() {
  const [internships, t] = await Promise.all([
    db.career.findMany({
      where: { isActive: true, type: "INTERNSHIP" },
      orderBy: { createdAt: "desc" },
    }),
    getTranslations("public.internships"),
  ]);

  const tracks = [
    { titleKey: "trackFieldTitle" as const, descKey: "trackFieldDesc" as const },
    { titleKey: "trackCommsTitle" as const, descKey: "trackCommsDesc" as const },
    { titleKey: "trackResearchTitle" as const, descKey: "trackResearchDesc" as const },
    { titleKey: "trackOpsTitle" as const, descKey: "trackOpsDesc" as const },
  ];

  return (
    <>
      <JsonLd
        data={[
          collectionPageJsonLd({
            name: t("heading"),
            path: "/internships",
            description: "Gain real-world experience in community development. Explore our internship opportunities.",
          }),
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: t("heading"), href: "/internships" },
          ]),
        ]}
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
                {t("heroDesc")}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                {internships.length > 0 && (
                  <a href="#openings"
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white transition hover:shadow-lg">
                    {t("viewOpenings")} <ArrowRight className="h-4 w-4" />
                  </a>
                )}
                <Link href="/careers"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white">
                  {t("allCareers")}
                </Link>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl">
                <Image src="/seed-images/gloford/hero-intern.jpg" alt={t("altInterns")} fill className="object-cover" sizes="50vw" />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Tracks */}
      <section className="bg-[var(--color-bg)] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mb-12 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">{t("tracksEyebrow")}</p>
              <h2 className="font-display text-3xl font-bold text-[var(--color-fg)]">{t("tracksHeading")}</h2>
            </div>
          </ScrollReveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {tracks.map((track, i) => (
              <ScrollReveal key={track.titleKey} delay={i * 0.1}>
                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 transition hover:shadow-lg hover:border-[rgb(var(--token-primary)/0.30)]">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[rgb(var(--token-primary)/0.10)]">
                    <GraduationCap className="h-5 w-5 text-[var(--color-primary)]" />
                  </div>
                  <h3 className="font-bold text-[var(--color-fg)]">{t(track.titleKey)}</h3>
                  <p className="mt-2 text-sm text-[var(--color-muted-fg)]">{t(track.descKey)}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Open internships */}
      <section id="openings" className="bg-[rgb(248_250_249)] py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <h2 className="font-display text-2xl font-bold text-[var(--color-fg)]">{t("currentOpenings")}</h2>
          </ScrollReveal>
          {internships.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-white p-12 text-center">
              <GraduationCap className="mx-auto h-12 w-12 text-[rgb(var(--token-muted-fg)/0.30)]" />
              <h3 className="mt-4 text-lg font-bold text-[var(--color-fg)]">{t("noOpenings")}</h3>
              <p className="mt-2 text-sm text-[var(--color-muted-fg)]">
                {t("noOpeningsDesc")}
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {internships.map((job, i) => (
                <ScrollReveal key={job.id} delay={i * 0.05}>
                  <Link href={`/careers/${job.slug}`}
                    className="group block rounded-2xl border border-[var(--color-border)] bg-white p-6 transition hover:shadow-xl hover:border-[rgb(var(--token-primary)/0.30)]">
                    <h3 className="text-lg font-bold text-[var(--color-fg)] group-hover:text-[var(--color-primary)]">{job.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-[var(--color-muted-fg)]">
                      <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {job.department}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>
                      <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {t("internship")}</span>
                    </div>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)]">
                      {t("applyNow")} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
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
            <h2 className="font-display text-3xl font-bold text-[var(--color-fg)]">{t("ctaHeading")}</h2>
            <p className="mt-4 text-[var(--color-muted-fg)]">
              {t("ctaDesc")}
            </p>
            <Link href="/contact"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white transition hover:shadow-lg">
              {t("contactUs")} <ArrowRight className="h-4 w-4" />
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
