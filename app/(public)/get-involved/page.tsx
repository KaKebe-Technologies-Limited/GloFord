import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getActiveTestimonials } from "@/lib/services/testimonials";
import { getActiveSiteStats } from "@/lib/services/siteStats";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { AnimatedCounter } from "@/components/motion/AnimatedCounter";
import { Heart, Users, Briefcase } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { collectionPageJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";

export const metadata: Metadata = {
  title: "Get Involved",
  description:
    "Make an impact. Donate, volunteer, or join our team to support lasting community change.",
  openGraph: {
    title: "Get Involved",
    description:
      "Make an impact. Donate, volunteer, or join our team to support lasting community change.",
    type: "website",
    url: `${APP_URL}/get-involved`,
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Gloford" }],
  },
  twitter: { card: "summary_large_image", title: "Get Involved" },
};

export default async function GetInvolvedPage() {
  const t = await getTranslations("public.getInvolved");
  const [testimonials, stats] = await Promise.all([
    getActiveTestimonials(),
    getActiveSiteStats(),
  ]);

  const CARDS = [
    {
      icon: Heart,
      title: t("cardDonateTitle"),
      description: t("cardDonateDesc"),
      cta: t("cardDonateCta"),
      href: "/donate",
      accent: "from-rose-500 to-pink-600",
    },
    {
      icon: Users,
      title: t("cardVolunteerTitle"),
      description: t("cardVolunteerDesc"),
      cta: t("cardVolunteerCta"),
      href: "/volunteer",
      accent: "from-emerald-500 to-teal-600",
    },
    {
      icon: Briefcase,
      title: t("cardCareersTitle"),
      description: t("cardCareersDesc"),
      cta: t("cardCareersCta"),
      href: "/careers",
      accent: "from-amber-500 to-orange-600",
    },
  ];

  return (
    <>
      <JsonLd
        data={[
          collectionPageJsonLd({
            name: "Get Involved",
            path: "/get-involved",
            description: "Make an impact. Donate, volunteer, or join our team to support lasting community change.",
          }),
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Get Involved", href: "/get-involved" },
          ]),
        ]}
      />

      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-[rgb(248_250_249)] via-white to-[rgb(240_247_244)] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
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

      {/* Three Cards */}
      <section className="w-full bg-[var(--color-bg)] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {CARDS.map((card, i) => (
              <ScrollReveal key={card.title} delay={i * 0.08}>
                <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                  <div
                    className={`flex h-40 items-center justify-center bg-gradient-to-br ${card.accent}`}
                  >
                    <card.icon className="h-14 w-14 text-white/90" />
                  </div>
                  <div className="flex flex-1 flex-col p-8">
                    <h3 className="font-display text-2xl font-bold">
                      {card.title}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--color-muted-fg)]">
                      {card.description}
                    </p>
                    <Link
                      href={card.href}
                      className="mt-6 inline-flex items-center rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[rgb(var(--token-primary)/0.90)]"
                    >
                      {card.cta}
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      {stats.length > 0 && (
        <section className="w-full bg-[rgb(var(--token-muted)/0.30)] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <ScrollReveal>
              <h2 className="text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
                {t("impactHeading")}
              </h2>
            </ScrollReveal>
            <div className="mt-12 grid grid-cols-2 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, i) => (
                <ScrollReveal key={stat.id} delay={i * 0.08}>
                  <div className="text-center">
                    <AnimatedCounter
                      value={stat.value}
                      className="font-display text-4xl font-bold text-[var(--color-primary)] sm:text-5xl"
                    />
                    <p className="mt-2 text-sm font-medium text-[var(--color-muted-fg)]">
                      {stat.label}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="relative w-full overflow-hidden bg-gradient-to-br from-[rgb(248_250_249)] via-white to-[rgb(240_247_244)] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <ScrollReveal>
              <h2 className="text-center font-display text-3xl font-bold tracking-tight text-[var(--color-fg)] sm:text-4xl">
                {t("voicesHeading")}
              </h2>
            </ScrollReveal>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.slice(0, 3).map((testimonial, i) => (
                <ScrollReveal key={testimonial.id} delay={i * 0.06}>
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-sm">
                    <svg
                      className="h-8 w-8 text-[rgb(var(--token-primary)/0.60)]"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11h4v10H0z" />
                    </svg>
                    <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted-fg)]">
                      {testimonial.quote}
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                      {testimonial.avatarUrl ? (
                        <img
                          src={testimonial.avatarUrl}
                          alt={testimonial.authorName}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgb(var(--token-primary)/0.10)] text-sm font-bold text-[var(--color-primary)]">
                          {testimonial.authorName[0]}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-fg)]">
                          {testimonial.authorName}
                        </p>
                        {(testimonial.authorRole || testimonial.authorOrg) && (
                          <p className="text-xs text-[var(--color-muted-fg)]">
                            {[testimonial.authorRole, testimonial.authorOrg]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="w-full bg-[var(--color-bg)] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <ScrollReveal>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {t("ctaHeading")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[var(--color-muted-fg)]">
              {t("ctaDesc")}
            </p>
            <Link
              href="/donate"
              className="mt-8 inline-flex items-center rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-[rgb(var(--token-primary)/0.90)]"
            >
              {t("ctaButton")}
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
