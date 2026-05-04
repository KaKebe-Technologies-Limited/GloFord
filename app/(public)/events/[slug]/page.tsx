import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CalendarDays, MapPin, ArrowLeft, CalendarPlus } from "lucide-react";
import { db } from "@/lib/db";
import { getPublicEvent } from "@/lib/services/events/public";
import { getRegistrationCounts } from "@/lib/services/events/registration";
import { EventRsvp } from "@/components/public/EventRsvp";
import { JsonLd } from "@/components/seo/JsonLd";
import { eventJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";

export async function generateStaticParams() {
  try {
    const items = await db.event.findMany({
      where: { isPublic: true },
      select: { slug: true },
    });
    return items.map((item) => ({ slug: item.slug }));
  } catch {
    return [];
  }
}

export const revalidate = 3600; // ISR: revalidate every hour

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const e = await getPublicEvent(slug);
  if (!e) return { title: "Event" };
  const title = e.seoTitle ?? e.title;
  const desc = e.seoDesc ?? e.description.slice(0, 160);
  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type: "article",
      url: `${APP_URL}/events/${slug}`,
      images: e.cover?.url
        ? [{ url: e.cover.url, width: 1200, height: 630, alt: e.title }]
        : [{ url: "/logo.png", width: 512, height: 512, alt: "Gloford" }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const t = await getTranslations("public.eventDetail");
  const { slug } = await params;
  const e = await getPublicEvent(slug);
  if (!e) notFound();
  const cover = e.cover;
  const counts = await getRegistrationCounts(e.id);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <JsonLd
        data={[
          eventJsonLd({
            title: e.title,
            slug,
            description: e.description,
            startsAt: e.startsAt,
            endsAt: e.endsAt ?? undefined,
            location: e.location ?? undefined,
            coverUrl: e.cover?.url,
          }),
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Events", href: "/events" },
            { name: e.title, href: `/events/${slug}` },
          ]),
        ]}
      />
      <Link
        href="/events"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> {t("allEvents")}
      </Link>

      <header className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight">{e.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-muted-fg)]">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            <time dateTime={e.startsAt.toISOString()}>
              {e.startsAt.toLocaleString(undefined, {
                dateStyle: "full",
                timeStyle: "short",
              })}
            </time>
            {e.endsAt ? (
              <>
                {" – "}
                <time dateTime={e.endsAt.toISOString()}>
                  {e.endsAt.toLocaleString(undefined, { timeStyle: "short" })}
                </time>
              </>
            ) : null}
          </span>
          {e.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {e.location}
            </span>
          ) : null}
        </div>
      </header>

      {cover ? (
        <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-muted)]">
          <Image
            src={cover.url}
            alt={cover.alt ?? e.title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </div>
      ) : null}

      <div className="prose prose-neutral mt-8 max-w-none whitespace-pre-line text-[var(--color-fg)]">
        {e.description}
      </div>

      {/* RSVP + Calendar */}
      <aside className="mt-10 grid gap-4 sm:grid-cols-2">
        <EventRsvp
          eventId={e.id}
          eventSlug={slug}
          capacity={e.capacity}
          goingCount={counts.going}
          currentStatus={null}
        />
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <h3 className="text-sm font-semibold">{t("addToCalendar")}</h3>
          <p className="mt-1 text-xs text-[var(--color-muted-fg)]">
            {t("addToCalendarDesc")}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <a
              href={`/api/events/${slug}/ical`}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm font-medium hover:bg-[var(--color-muted)]"
            >
              <CalendarPlus className="h-4 w-4" /> {t("downloadIcs")}
            </a>
            <a
              href="/api/events/feed.ics"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm font-medium hover:bg-[var(--color-muted)]"
            >
              <CalendarDays className="h-4 w-4" /> {t("subscribeToFeed")}
            </a>
          </div>
        </div>
      </aside>
    </article>
  );
}
