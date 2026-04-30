import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { blocksSchema, type Block } from "@/lib/blocks/types";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { AnimatedCounter } from "@/components/motion/AnimatedCounter";
import { getCollectionConfig, type PageCollectionKind, toCollectionPath } from "@/lib/pages/collections";

export async function BlockRenderer({ blocks }: { blocks: unknown }) {
  const parsed = blocksSchema.safeParse(blocks);
  if (!parsed.success) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[BlockRenderer] invalid blocks", parsed.error.flatten());
    }
    return null;
  }

  return (
    <>
      {parsed.data.map((b) => (
        <BlockSwitch key={b.id} block={b} />
      ))}
    </>
  );
}

async function BlockSwitch({ block }: { block: Block }) {
  switch (block.type) {
    case "hero":
      return <HeroBlock data={block.data} />;
    case "richText":
      return <RichTextBlock data={block.data} />;
    case "cta":
      return <CtaBlock data={block.data} />;
    case "stats":
      return <StatsBlock data={block.data} />;
    case "gallery":
      return <GalleryBlock data={block.data} />;
    case "donateCta":
      return <DonateCtaBlock data={block.data} />;
    case "programGrid":
      return <ProgramGridBlock data={block.data} />;
    case "postList":
      return <PostListBlock data={block.data} />;
    case "featureSplit":
      return <FeatureSplitBlock data={block.data} />;
    case "actionCards":
      return <ActionCardsBlock data={block.data} />;
    case "eventList":
      return <EventListBlock data={block.data} />;
    case "partnerLogos":
      return <PartnerLogosBlock data={block.data} />;
    case "pageCollection":
      return <PageCollectionBlock data={block.data} />;
  }
}

/* ──────────────────────────────────────────────────────────────
   HERO — Full-width dark overlay on background image
   ────────────────────────────────────────────────────────────── */
async function HeroBlock({ data }: { data: Extract<Block, { type: "hero" }>["data"] }) {
  const media = data.imageMediaId
    ? await db.media.findUnique({
        where: { id: data.imageMediaId },
        select: { url: true, alt: true },
      })
    : null;

  return (
    <section
      className="relative min-h-[70vh] overflow-hidden bg-[rgb(26_40_35)]"
      style={
        media?.url
          ? { backgroundImage: `url(${media.url})`, backgroundSize: "cover", backgroundPosition: "center" }
          : undefined
      }
    >
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[rgb(26_40_35/0.85)] via-[rgb(26_40_35/0.7)] to-[rgb(26_40_35/0.5)]" />

      <div className="relative mx-auto flex max-w-7xl items-center px-4 py-28 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
        <ScrollReveal className="max-w-2xl">
          <div className="space-y-6">
            {data.eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                {data.eyebrow}
              </p>
            ) : null}
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              {data.heading}
            </h1>
            {data.subheading ? (
              <p className="max-w-xl text-lg leading-relaxed text-white/80">
                {data.subheading}
              </p>
            ) : null}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              {data.ctaLabel && data.ctaHref ? (
                <Link
                  href={data.ctaHref}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-7 py-3.5 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  {data.ctaLabel}
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              ) : null}
              {data.secondaryCtaLabel && data.secondaryCtaHref ? (
                <Link
                  href={data.secondaryCtaHref}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10"
                >
                  {data.secondaryCtaLabel}
                </Link>
              ) : null}
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* Bottom navigation dots (decorative) */}
      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-2">
        <span className="h-2 w-8 rounded-full bg-white" />
        <span className="h-2 w-2 rounded-full bg-white/40" />
        <span className="h-2 w-2 rounded-full bg-white/40" />
      </div>

      {/* Side arrows (decorative) */}
      <button
        type="button"
        className="absolute left-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 text-white/60 lg:flex"
        aria-hidden="true"
        tabIndex={-1}
      >
        &lsaquo;
      </button>
      <button
        type="button"
        className="absolute right-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 text-white/60 lg:flex"
        aria-hidden="true"
        tabIndex={-1}
      >
        &rsaquo;
      </button>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
   RICH TEXT
   ────────────────────────────────────────────────────────────── */
function RichTextBlock({ data }: { data: Extract<Block, { type: "richText" }>["data"] }) {
  return (
    <section className="w-full px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <ScrollReveal>
          <div
            className="prose prose-gray max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-p:text-[1.04rem] prose-p:leading-8 prose-a:text-[var(--color-primary)] prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: data.html }}
          />
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
   CTA — Call to action banner
   ────────────────────────────────────────────────────────────── */
function CtaBlock({ data }: { data: Extract<Block, { type: "cta" }>["data"] }) {
  const isPrimary = data.variant === "primary";

  return (
    <section className={`w-full px-4 py-16 sm:px-6 lg:px-8 ${isPrimary ? "bg-[rgb(26_40_35)] text-white" : ""}`}>
      <ScrollReveal>
        <div className={`mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center ${
          isPrimary ? "" : "rounded-xl border border-gray-100 bg-white p-8 shadow-sm"
        }`}>
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{data.heading}</h2>
            {data.body ? (
              <p className={`mt-2 max-w-2xl ${isPrimary ? "text-white/70" : "text-gray-500"}`}>
                {data.body}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-3">
            <Link
              href={data.buttonHref}
              className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition ${
                isPrimary
                  ? "bg-white text-[var(--color-primary)] hover:bg-gray-100"
                  : "bg-[var(--color-primary)] text-white hover:brightness-110"
              }`}
            >
              {data.buttonLabel}
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
   STATS — Animated counter cards
   ────────────────────────────────────────────────────────────── */
function StatsBlock({ data }: { data: Extract<Block, { type: "stats" }>["data"] }) {
  return (
    <section className="w-full bg-[var(--color-primary)] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          {data.heading ? (
            <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {data.heading}
            </h2>
          ) : null}
          <dl className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {data.items.map((item, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <div className="text-center">
                  <dd className="text-4xl font-bold text-white sm:text-5xl">
                    <AnimatedCounter value={item.value} />
                  </dd>
                  <dt className="mt-3 text-sm font-medium uppercase tracking-wider text-white/70">
                    {item.label}
                  </dt>
                </div>
              </ScrollReveal>
            ))}
          </dl>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
   GALLERY — Photo grid with captions
   ────────────────────────────────────────────────────────────── */
async function GalleryBlock({ data }: { data: Extract<Block, { type: "gallery" }>["data"] }) {
  if (data.mediaIds.length === 0) return null;
  const items = await db.media.findMany({
    where: { id: { in: data.mediaIds } },
    select: { id: true, url: true, alt: true },
  });
  const ordered = data.mediaIds.map((id) => items.find((m) => m.id === id)).filter(Boolean) as typeof items;

  return (
    <section className="w-full px-4 py-16 sm:px-6 lg:px-8">
      <ScrollReveal>
        <div className="mx-auto max-w-7xl">
          {data.heading ? (
            <div className="mb-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">Collections</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">{data.heading}</h2>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {ordered.map((m) => (
              <div key={m.id} className="group relative aspect-square overflow-hidden rounded-lg">
                <Image
                  src={m.url}
                  alt={m.alt ?? ""}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
   DONATE CTA — Dark section with gradient accent
   ────────────────────────────────────────────────────────────── */
function DonateCtaBlock({ data }: { data: Extract<Block, { type: "donateCta" }>["data"] }) {
  const href = data.campaignSlug ? `/donate/${data.campaignSlug}` : "/donate";

  return (
    <section className="w-full bg-[var(--color-primary)] px-4 py-16 sm:px-6 lg:px-8">
      <ScrollReveal>
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">{data.heading}</h2>
            {data.body ? <p className="mt-3 text-white/70">{data.body}</p> : null}
          </div>
          <Link
            href={href}
            className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-gray-100"
          >
            {data.buttonLabel}
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </ScrollReveal>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
   PROGRAM GRID — Project cards with category badge
   ────────────────────────────────────────────────────────────── */
async function ProgramGridBlock({ data }: { data: Extract<Block, { type: "programGrid" }>["data"] }) {
  const programs = await db.program.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
    take: data.limit,
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      cover: { select: { url: true, alt: true } },
    },
  });
  if (programs.length === 0) return null;

  return (
    <section className="w-full bg-gray-50 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionIntro eyebrow="Our Work" heading={data.heading ?? "Featured Projects"} intro={data.intro} centered />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {programs.map((p, index) => (
            <ScrollReveal key={p.id} delay={index * 0.05}>
              <Link
                href={`/programs/${p.slug}`}
                className="group block overflow-hidden rounded-xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative overflow-hidden">
                  {p.cover?.url ? (
                    <div className="relative aspect-[4/3] w-full">
                      <Image src={p.cover.url} alt={p.cover.alt ?? p.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-gradient-to-br from-[rgb(var(--token-primary)/0.10)] to-[rgb(var(--token-primary)/0.5)]" />
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-[var(--color-fg)]">{p.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-gray-500">{p.summary}</p>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal className="mt-10 text-center">
          <Link
            href="/programs"
            className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 px-6 py-3 text-sm font-semibold text-[var(--color-fg)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            Read More About Our Work
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
   POST LIST — News/blog cards with date badges
   ────────────────────────────────────────────────────────────── */
async function PostListBlock({ data }: { data: Extract<Block, { type: "postList" }>["data"] }) {
  const posts = await db.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: data.limit,
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      publishedAt: true,
      cover: { select: { url: true, alt: true } },
    },
  });
  if (posts.length === 0) return null;

  return (
    <section className="w-full px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionIntro eyebrow="News & Updates" heading={data.heading ?? "Latest from the Blog"} intro={data.intro} centered />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {posts.map((p, index) => (
            <ScrollReveal key={p.id} delay={index * 0.05}>
              <Link
                href={`/blog/${p.slug}`}
                className="group block overflow-hidden rounded-xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                {p.cover?.url ? (
                  <div className="relative aspect-[4/3] w-full">
                    <Image src={p.cover.url} alt={p.cover.alt ?? p.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                ) : null}
                <div className="p-5">
                  <h3 className="text-sm font-bold leading-snug text-[var(--color-fg)] group-hover:text-[var(--color-primary)]">{p.title}</h3>
                  {p.publishedAt ? (
                    <time className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                      {new Date(p.publishedAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                    </time>
                  ) : null}
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal className="mt-10 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 px-6 py-3 text-sm font-semibold text-[var(--color-fg)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            View All Articles
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
   FEATURE SPLIT — Two-column (text + image) with quote style
   ────────────────────────────────────────────────────────────── */
async function FeatureSplitBlock({ data }: { data: Extract<Block, { type: "featureSplit" }>["data"] }) {
  const media = data.imageMediaId
    ? await db.media.findUnique({ where: { id: data.imageMediaId }, select: { url: true, alt: true } })
    : null;

  const image = (
    <ScrollReveal className="relative">
      {media?.url ? (
        <div className="relative aspect-[4/3.5] w-full overflow-hidden rounded-xl">
          <Image src={media.url} alt={media.alt ?? data.heading} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
        </div>
      ) : (
        <div className="aspect-[4/3.5] rounded-xl bg-gradient-to-br from-[rgb(var(--token-primary)/0.10)] to-[rgb(var(--token-primary)/0.5)]" />
      )}
    </ScrollReveal>
  );

  const copy = (
    <ScrollReveal>
      <div className="space-y-5">
        {data.eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">{data.eyebrow}</p>
        ) : null}
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{data.heading}</h2>
        <p className="text-base leading-relaxed text-gray-600">{data.body}</p>
        {data.ctaLabel && data.ctaHref ? (
          <Link
            href={data.ctaHref}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
          >
            {data.ctaLabel}
            <span aria-hidden="true">&rarr;</span>
          </Link>
        ) : null}
      </div>
    </ScrollReveal>
  );

  return (
    <section className="w-full px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {data.reverse ? image : copy}
          {data.reverse ? copy : image}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
   ACTION CARDS — Icon cards grid (Get Involved)
   ────────────────────────────────────────────────────────────── */
function ActionCardsBlock({ data }: { data: Extract<Block, { type: "actionCards" }>["data"] }) {
  return (
    <section className="w-full px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionIntro eyebrow="Get Involved" heading={data.heading ?? "How You Can Help"} intro={data.intro} centered />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {data.items.map((item, index) => (
            <ScrollReveal key={`${item.title}-${index}`} delay={index * 0.05}>
              <Link
                href={item.href}
                className="group block rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-[var(--color-primary)] transition group-hover:bg-[rgb(var(--token-primary)/0.10)]">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{item.body}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)]">
                  {item.label}
                  <span aria-hidden="true">&rarr;</span>
                </span>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
   EVENT LIST — Date badge style (day/month)
   ────────────────────────────────────────────────────────────── */
async function EventListBlock({ data }: { data: Extract<Block, { type: "eventList" }>["data"] }) {
  const events = await db.event.findMany({
    where: { isPublic: true },
    orderBy: { startsAt: "asc" },
    take: data.limit,
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      startsAt: true,
      location: true,
      cover: { select: { url: true, alt: true } },
    },
  });
  if (events.length === 0) return null;

  return (
    <section className="w-full border-t border-gray-100 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <SectionIntro eyebrow="Events" heading={data.heading ?? "Upcoming Events"} intro={data.intro} centered />
        <div className="space-y-4">
          {events.map((event, index) => {
            const d = new Date(event.startsAt);
            return (
              <ScrollReveal key={event.id} delay={index * 0.05}>
                <Link
                  href={`/events/${event.slug}`}
                  className="group flex items-center gap-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  {/* Date badge */}
                  <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-gray-50">
                    <span className="text-2xl font-bold leading-none text-[var(--color-primary)]">{d.getDate()}</span>
                    <span className="mt-0.5 text-xs font-semibold uppercase text-[var(--color-primary)]">
                      {d.toLocaleDateString("en-US", { month: "short" })}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold group-hover:text-[var(--color-primary)]">{event.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      {event.location ? (
                        <span className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0Z" /></svg>
                          {event.location}
                        </span>
                      ) : null}
                      <span className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                        {d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  <svg className="h-5 w-5 shrink-0 text-gray-300 transition group-hover:text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
        <ScrollReveal className="mt-8 text-center">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 px-6 py-3 text-sm font-semibold text-[var(--color-fg)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            View All Events
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
   PARTNER LOGOS — Logo grid with cards
   ────────────────────────────────────────────────────────────── */
async function PartnerLogosBlock({ data }: { data: Extract<Block, { type: "partnerLogos" }>["data"] }) {
  if (data.mediaIds.length === 0) return null;
  const logos = await db.media.findMany({
    where: { id: { in: data.mediaIds } },
    select: { id: true, url: true, alt: true },
  });
  const ordered = data.mediaIds.map((id) => logos.find((item) => item.id === id)).filter(Boolean) as typeof logos;

  return (
    <section className="w-full px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal>
          <SectionIntro eyebrow="Our Partners" heading={data.heading ?? "Trusted Partners"} intro={data.intro} centered />
          <div className="grid grid-cols-2 items-center gap-6 md:grid-cols-4">
            {ordered.map((logo, i) => (
              <ScrollReveal key={logo.id} delay={i * 0.08}>
                <div className="relative flex min-h-24 items-center justify-center rounded-xl border border-gray-100 bg-white px-6 py-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <Image src={logo.url} alt={logo.alt ?? ""} width={160} height={56} className="max-h-14 w-auto object-contain" />
                </div>
              </ScrollReveal>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/partners"
              className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 px-6 py-3 text-sm font-semibold text-[var(--color-fg)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              View All Partners
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
   PAGE COLLECTION — Impact stories / team / reports / partners
   ────────────────────────────────────────────────────────────── */
async function PageCollectionBlock({ data }: { data: Extract<Block, { type: "pageCollection" }>["data"] }) {
  const config = getCollectionConfig(data.collection as PageCollectionKind);
  const rows = await db.page.findMany({
    where: { status: "PUBLISHED", slug: { startsWith: config.prefix } },
    orderBy: [{ updatedAt: "desc" }],
    take: data.limit,
    select: {
      id: true,
      slug: true,
      title: true,
      seoDesc: true,
      updatedAt: true,
      blocks: true,
    },
  });
  if (rows.length === 0) return null;

  const imageIds = rows
    .map((row) => findPreviewImageId(row.blocks))
    .filter(Boolean) as string[];
  const media = imageIds.length
    ? await db.media.findMany({
        where: { id: { in: imageIds } },
        select: { id: true, url: true, alt: true },
      })
    : [];
  const mediaMap = new Map(media.map((item) => [item.id, item]));

  const isStory = data.collection === "impactStory";

  return (
    <section className="w-full px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow={isStory ? "Impact Stories" : undefined}
          heading={data.heading ?? config.title}
          intro={data.intro}
          centered
        />
        <div className={`grid gap-6 ${isStory ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"}`}>
          {rows.map((row, index) => {
            const previewMedia = mediaMap.get(findPreviewImageId(row.blocks) ?? "");
            return (
              <ScrollReveal key={row.id} delay={index * 0.05}>
                <Link
                  href={toCollectionPath(data.collection as PageCollectionKind, row.slug)}
                  className={`group block overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md ${
                    isStory ? "flex items-stretch" : ""
                  }`}
                >
                  {previewMedia?.url ? (
                    <div className={`relative overflow-hidden ${
                      isStory ? "w-40 shrink-0 sm:w-48" : "aspect-[4/2.7] w-full"
                    }`}>
                      <Image
                        src={previewMedia.url}
                        alt={previewMedia.alt ?? row.title}
                        fill
                        sizes={isStory ? "192px" : "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"}
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className={`bg-gradient-to-br from-[rgb(var(--token-primary)/0.10)] to-[rgb(var(--token-primary)/0.5)] ${
                      isStory ? "w-40 shrink-0 sm:w-48" : "aspect-[4/2.7]"
                    }`} />
                  )}
                  <div className="flex-1 p-6">
                    <h3 className="text-lg font-bold group-hover:text-[var(--color-primary)]">{row.title}</h3>
                    {row.seoDesc ? (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-500">{row.seoDesc}</p>
                    ) : null}
                  </div>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
        <ScrollReveal className="mt-8 text-center">
          <Link
            href={config.basePath}
            className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 px-6 py-3 text-sm font-semibold text-[var(--color-fg)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            {isStory ? "Read More Stories" : `View All ${config.title}`}
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
   SHARED — Section header with eyebrow label
   ────────────────────────────────────────────────────────────── */
function SectionIntro({
  eyebrow,
  heading,
  intro,
  centered = false,
  compact = false,
}: {
  eyebrow?: string;
  heading?: string;
  intro?: string;
  centered?: boolean;
  compact?: boolean;
}) {
  if (!heading && !intro) return null;

  return (
    <ScrollReveal className={`mb-10 ${centered ? "text-center" : ""}`}>
      {eyebrow ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">{eyebrow}</p>
      ) : null}
      {heading ? (
        <h2 className={`text-3xl font-bold tracking-tight ${compact ? "" : "sm:text-4xl"}`}>{heading}</h2>
      ) : null}
      {intro ? (
        <p className={`mt-3 max-w-2xl text-gray-500 ${centered ? "mx-auto" : ""}`}>{intro}</p>
      ) : null}
    </ScrollReveal>
  );
}

/* ──────────────────────────────────────────────────────────────
   UTILITY
   ────────────────────────────────────────────────────────────── */
function findPreviewImageId(blocks: unknown): string | null {
  const parsed = blocksSchema.safeParse(blocks);
  if (!parsed.success) return null;

  for (const block of parsed.data) {
    if ("imageMediaId" in block.data && typeof block.data.imageMediaId === "string" && block.data.imageMediaId) {
      return block.data.imageMediaId;
    }
    if ("mediaIds" in block.data && Array.isArray(block.data.mediaIds) && block.data.mediaIds[0]) {
      return block.data.mediaIds[0];
    }
  }

  return null;
}
