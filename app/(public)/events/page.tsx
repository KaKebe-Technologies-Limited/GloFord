import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MapPin } from "lucide-react";
import { listPublicEvents } from "@/lib/services/events/public";

export const metadata = { title: "Events" };

export default async function EventsIndex() {
  const events = await listPublicEvents();

  const now = Date.now();
  const upcoming = events.filter((e) => e.startsAt.getTime() >= now);
  const past = events.filter((e) => e.startsAt.getTime() < now);

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <header className="mb-10 space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">Events</h1>
        <p className="text-[--color-muted-fg]">
          Join us online or in person for community events and launches.
        </p>
      </header>

      {events.length === 0 ? (
        <p className="text-[--color-muted-fg]">Events will appear here once scheduled.</p>
      ) : (
        <>
          {upcoming.length > 0 ? <EventGrid title="Upcoming" rows={upcoming} /> : null}
          {past.length > 0 ? (
            <div className="mt-14">
              <EventGrid title="Past" rows={past} muted />
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function EventGrid({
  title,
  rows,
  muted = false,
}: {
  title: string;
  rows: Awaited<ReturnType<typeof listPublicEvents>>;
  muted?: boolean;
}) {
  return (
    <div>
      <h2 className="mb-5 text-lg font-semibold uppercase tracking-wider text-[--color-muted-fg]">
        {title}
      </h2>
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((e) => (
          <li key={e.id}>
            <Link
              href={`/events/${e.slug}`}
              className={
                "group block overflow-hidden rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] transition hover:shadow-sm " +
                (muted ? "opacity-80" : "")
              }
            >
              {e.cover?.url ? (
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-[--color-muted]">
                  <Image
                    src={e.cover.url}
                    alt={e.cover.alt ?? e.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition group-hover:scale-[1.02]"
                  />
                </div>
              ) : null}
              <div className="space-y-2 p-5">
                <h3 className="text-lg font-semibold">{e.title}</h3>
                <p className="flex items-center gap-1.5 text-xs text-[--color-muted-fg]">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  {e.startsAt.toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                {e.location ? (
                  <p className="flex items-center gap-1.5 text-xs text-[--color-muted-fg]">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {e.location}
                  </p>
                ) : null}
                <p className="line-clamp-3 text-sm text-[--color-muted-fg]">{e.description}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
