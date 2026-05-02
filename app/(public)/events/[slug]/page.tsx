import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, ArrowLeft, CalendarPlus } from "lucide-react";
import { db } from "@/lib/db";
import { getPublicEvent } from "@/lib/services/events/public";
import { getRegistrationCounts } from "@/lib/services/events/registration";
import { EventRsvp } from "@/components/public/EventRsvp";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const e = await getPublicEvent(slug);
  if (!e) return { title: "Event" };
  return {
    title: e.title,
    description: e.description.slice(0, 160),
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const e = await getPublicEvent(slug);
  if (!e) notFound();
  const cover = e.cover;
  const counts = await getRegistrationCounts(e.id);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <Link
        href="/events"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> All events
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
          <h3 className="text-sm font-semibold">Add to calendar</h3>
          <p className="mt-1 text-xs text-[var(--color-muted-fg)]">
            Download an .ics file or subscribe to our event feed.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <a
              href={`/api/events/${slug}/ical`}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm font-medium hover:bg-[var(--color-muted)]"
            >
              <CalendarPlus className="h-4 w-4" /> Download .ics
            </a>
            <a
              href="/api/events/feed.ics"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm font-medium hover:bg-[var(--color-muted)]"
            >
              <CalendarDays className="h-4 w-4" /> Subscribe to feed
            </a>
          </div>
        </div>
      </aside>
    </article>
  );
}
