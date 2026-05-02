import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { CalendarDays, MapPin, ArrowRight, Clock } from "lucide-react";
import { listPublicEvents } from "@/lib/services/events/public";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";
const DEFAULT_OG = `${APP_URL}/seed-images/gloford/hero-community.jpg`;

export const metadata: Metadata = {
  title: "Events",
  description: "Join us for community events, workshops, and launches.",
  openGraph: {
    title: "Events",
    description: "Join us for community events, workshops, and launches.",
    type: "website",
    url: `${APP_URL}/events`,
    images: [{ url: DEFAULT_OG, width: 1200, height: 630, alt: "Gloford Foundation" }],
  },
  twitter: { card: "summary_large_image", title: "Events" },
};

export default async function EventsPage() {
  const t = await getTranslations("public.events");
  const events = await listPublicEvents();
  const now = Date.now();
  const upcoming = events.filter((e) => e.startsAt.getTime() >= now);
  const past = events.filter((e) => e.startsAt.getTime() < now);

  return (
    <>
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

      {events.length === 0 ? (
        <section className="bg-[var(--color-bg)] py-20">
          <div className="text-center">
            <Clock className="mx-auto mb-4 h-12 w-12 text-[var(--color-muted-fg)]" />
            <p className="text-lg text-[var(--color-muted-fg)]">
              {t("empty")}
            </p>
          </div>
        </section>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="bg-[var(--color-bg)] py-16 sm:py-20">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <ScrollReveal>
                  <h2 className="mb-10 font-display text-2xl font-bold text-[var(--color-fg)]">
                    {t("upcoming")}
                  </h2>
                </ScrollReveal>
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {upcoming.map((e, i) => (
                    <ScrollReveal key={e.id} delay={i * 0.1}>
                      <EventCard event={e} atLabel={t("at")} viewDetailsLabel={t("viewDetails")} />
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section className="bg-[rgb(248_250_249)] py-16 sm:py-20">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <ScrollReveal>
                  <h2 className="mb-10 font-display text-2xl font-bold text-[var(--color-fg)]">
                    {t("past")}
                  </h2>
                </ScrollReveal>
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {past.map((e, i) => (
                    <ScrollReveal key={e.id} delay={i * 0.1}>
                      <EventCard event={e} muted atLabel={t("at")} viewDetailsLabel={t("viewDetails")} />
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

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
            <Link
              href="/contact"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white transition hover:shadow-lg"
            >
              {t("ctaButton")} <ArrowRight className="h-4 w-4" />
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}

function EventCard({
  event,
  muted = false,
  atLabel,
  viewDetailsLabel,
}: {
  event: Awaited<ReturnType<typeof listPublicEvents>>[number];
  muted?: boolean;
  atLabel: string;
  viewDetailsLabel: string;
}) {
  const date = new Date(event.startsAt);
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();

  return (
    <Link
      href={`/events/${event.slug}`}
      className={`group block overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white transition hover:shadow-xl ${muted ? "opacity-75" : ""}`}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-[var(--color-muted)]">
        {event.cover?.url ? (
          <Image
            src={event.cover.url}
            alt={event.cover.alt ?? event.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[rgb(240_247_244)] to-[rgb(220_237_230)]">
            <CalendarDays className="h-12 w-12 text-[rgb(var(--token-primary)/0.20)]" />
          </div>
        )}
        {/* Date badge */}
        <div className="absolute left-4 top-4 rounded-xl bg-white px-3 py-2 text-center shadow-lg">
          <span className="block text-xs font-semibold uppercase text-[var(--color-primary)]">
            {month}
          </span>
          <span className="block text-xl font-bold text-[var(--color-fg)]">{day}</span>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-lg font-bold text-[var(--color-fg)] group-hover:text-[var(--color-primary)]">
          {event.title}
        </h3>
        <div className="mt-3 space-y-1.5">
          <p className="flex items-center gap-2 text-sm text-[var(--color-muted-fg)]">
            <CalendarDays className="h-4 w-4 flex-shrink-0" />
            {date.toLocaleDateString("en-US", { dateStyle: "medium" })} {atLabel}{" "}
            {date.toLocaleTimeString("en-US", { timeStyle: "short" })}
          </p>
          {event.location && (
            <p className="flex items-center gap-2 text-sm text-[var(--color-muted-fg)]">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              {event.location}
            </p>
          )}
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[var(--color-muted-fg)]">
          {event.description}
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)]">
          {viewDetailsLabel} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
