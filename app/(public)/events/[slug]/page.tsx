import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, ArrowLeft } from "lucide-react";
import { getPublicEvent } from "@/lib/services/events/public";

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

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <Link
        href="/events"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-[--color-muted-fg] hover:text-[--color-fg]"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> All events
      </Link>

      <header className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight">{e.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-[--color-muted-fg]">
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
        <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-[--radius-lg] bg-[--color-muted]">
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

      <div className="prose prose-neutral mt-8 max-w-none whitespace-pre-line text-[--color-fg]">
        {e.description}
      </div>
    </article>
  );
}
