import Link from "next/link";
import { db } from "@/lib/db";
import { blocksSchema, type Block } from "@/lib/blocks/types";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { FloatingShapes } from "@/components/motion/FloatingShapes";

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
  }
}

async function HeroBlock({ data }: { data: Extract<Block, { type: "hero" }>["data"] }) {
  const media = data.imageMediaId
    ? await db.media.findUnique({
        where: { id: data.imageMediaId },
        select: { url: true, alt: true },
      })
    : null;

  return (
    <section className="relative overflow-hidden border-b border-[--color-border] bg-[radial-gradient(circle_at_top_left,rgba(245,215,129,0.24),transparent_28%),linear-gradient(180deg,rgba(250,247,240,0.92),rgba(255,255,255,1))]">
      <FloatingShapes />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-28">
        <ScrollReveal className="relative z-10">
          <div className="space-y-6">
            {data.eyebrow ? (
              <p className="inline-flex rounded-full border border-[--color-border] bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[--color-muted-fg] shadow-sm">
                {data.eyebrow}
              </p>
            ) : null}
            <h1 className="max-w-3xl text-5xl font-semibold leading-[0.95] tracking-tight text-balance sm:text-6xl lg:text-7xl">
              {data.heading}
            </h1>
            {data.subheading ? (
              <p className="max-w-2xl text-lg leading-8 text-[--color-muted-fg] sm:text-xl">
                {data.subheading}
              </p>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              {data.ctaLabel && data.ctaHref ? (
                <Link
                  href={data.ctaHref}
                  className="inline-flex items-center justify-center rounded-[--radius-md] bg-[--color-primary] px-6 py-3 text-sm font-semibold text-[--color-primary-fg] shadow-[0_18px_50px_rgba(201,168,76,0.28)] transition hover:-translate-y-0.5 hover:opacity-95"
                >
                  {data.ctaLabel}
                </Link>
              ) : null}
              {data.secondaryCtaLabel && data.secondaryCtaHref ? (
                <Link
                  href={data.secondaryCtaHref}
                  className="inline-flex items-center justify-center rounded-[--radius-md] border border-[--color-border] bg-white/80 px-6 py-3 text-sm font-semibold text-[--color-fg] transition hover:bg-white"
                >
                  {data.secondaryCtaLabel}
                </Link>
              ) : null}
            </div>
          </div>
        </ScrollReveal>
        <ScrollReveal delay={0.1} className="relative z-10">
          <div className="relative">
            <div className="absolute -left-6 top-8 hidden h-28 w-28 rounded-[28px] border border-white/60 bg-white/70 shadow-xl backdrop-blur sm:block" />
            <div className="absolute -bottom-6 right-6 hidden h-20 w-44 rounded-full border border-[--color-border] bg-white/75 shadow-lg backdrop-blur sm:block" />
            {media?.url ? (
              <div className="relative overflow-hidden rounded-[calc(var(--radius-lg)+0.7rem)] border border-white/70 bg-[--color-muted] shadow-[0_35px_120px_rgba(15,23,42,0.15)]">
                <div className="absolute inset-0 bg-gradient-to-tr from-[rgba(15,23,42,0.28)] via-transparent to-transparent" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={media.url} alt={media.alt ?? ""} className="aspect-[4/4.3] w-full object-cover" />
              </div>
            ) : (
              <div className="aspect-[4/4.3] rounded-[calc(var(--radius-lg)+0.7rem)] bg-gradient-to-br from-[--color-primary]/20 via-white to-[--color-accent]/20 shadow-[0_35px_120px_rgba(15,23,42,0.12)]" />
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function RichTextBlock({ data }: { data: Extract<Block, { type: "richText" }>["data"] }) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <ScrollReveal>
        <div
          className="prose prose-slate max-w-none prose-headings:font-serif prose-p:text-[1.04rem] prose-p:leading-8"
          dangerouslySetInnerHTML={{ __html: data.html }}
        />
      </ScrollReveal>
    </section>
  );
}

function CtaBlock({ data }: { data: Extract<Block, { type: "cta" }>["data"] }) {
  const variants = {
    primary: "bg-[--color-primary] text-[--color-primary-fg]",
    secondary: "bg-[--color-secondary] text-[--color-secondary-fg]",
    outline: "border border-[--color-border] bg-white",
  } as const;

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <ScrollReveal>
        <div className="rounded-[calc(var(--radius-lg)+0.25rem)] border border-[--color-border] bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(250,247,240,0.92))] px-8 py-10 text-center shadow-[0_22px_80px_rgba(15,23,42,0.08)]">
          <h2 className="text-3xl font-semibold tracking-tight">{data.heading}</h2>
          {data.body ? <p className="mx-auto mt-3 max-w-2xl text-[--color-muted-fg]">{data.body}</p> : null}
          <Link
            href={data.buttonHref}
            className={`mt-6 inline-flex items-center rounded-[--radius-md] px-5 py-3 font-medium transition hover:-translate-y-0.5 ${variants[data.variant]}`}
          >
            {data.buttonLabel}
          </Link>
        </div>
      </ScrollReveal>
    </section>
  );
}

function StatsBlock({ data }: { data: Extract<Block, { type: "stats" }>["data"] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <ScrollReveal>
        <div className="rounded-[calc(var(--radius-lg)+0.25rem)] border border-[--color-border] bg-[--color-card] px-6 py-8 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:px-8">
          {data.heading ? (
            <h2 className="mb-8 text-center text-3xl font-semibold tracking-tight">{data.heading}</h2>
          ) : null}
          <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {data.items.map((item, i) => (
              <div key={i} className="rounded-[--radius-md] bg-[--color-secondary] px-5 py-6 text-center">
                <dt className="text-xs font-semibold uppercase tracking-[0.22em] text-[--color-muted-fg]">{item.label}</dt>
                <dd className="mt-3 text-3xl font-semibold sm:text-4xl">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </ScrollReveal>
    </section>
  );
}

async function GalleryBlock({ data }: { data: Extract<Block, { type: "gallery" }>["data"] }) {
  if (data.mediaIds.length === 0) return null;
  const items = await db.media.findMany({
    where: { id: { in: data.mediaIds } },
    select: { id: true, url: true, alt: true },
  });
  const ordered = data.mediaIds.map((id) => items.find((m) => m.id === id)).filter(Boolean) as typeof items;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <ScrollReveal>
        <div>
          {data.heading ? <h2 className="mb-6 text-3xl font-semibold tracking-tight">{data.heading}</h2> : null}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {ordered.map((m) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={m.id} src={m.url} alt={m.alt ?? ""} loading="lazy" className="aspect-square w-full rounded-[calc(var(--radius-md)+0.2rem)] object-cover shadow-sm" />
            ))}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

function DonateCtaBlock({ data }: { data: Extract<Block, { type: "donateCta" }>["data"] }) {
  const href = data.campaignSlug ? `/donate/${data.campaignSlug}` : "/donate";

  return (
    <section className="mx-auto max-w-6xl px-4 py-18 sm:px-6 lg:px-8">
      <ScrollReveal>
        <div className="relative overflow-hidden rounded-[calc(var(--radius-lg)+0.5rem)] bg-[linear-gradient(135deg,rgba(35,53,78,0.98),rgba(14,27,39,0.98))] px-8 py-12 text-[--color-primary-fg] shadow-[0_30px_120px_rgba(15,23,42,0.24)] sm:px-12">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(232,201,107,0.28),transparent_58%)]" />
          <div className="relative max-w-3xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{data.heading}</h2>
            {data.body ? <p className="mt-4 max-w-2xl text-white/80">{data.body}</p> : null}
            <Link href={href} className="mt-7 inline-flex items-center rounded-[--radius-md] bg-[--color-primary] px-6 py-3 font-semibold text-[--color-primary-fg] transition hover:-translate-y-0.5">
              {data.buttonLabel}
            </Link>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

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
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionIntro heading={data.heading} intro={data.intro} />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {programs.map((p, index) => (
          <ScrollReveal key={p.id} delay={index * 0.05}>
            <Link
              href={`/programs/${p.slug}`}
              className="group block overflow-hidden rounded-[calc(var(--radius-lg)+0.15rem)] border border-[--color-border] bg-[--color-card] shadow-[0_16px_54px_rgba(15,23,42,0.06)] transition hover:-translate-y-1"
            >
              {p.cover?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.cover.url} alt={p.cover.alt ?? p.title} className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
              ) : (
                <div className="aspect-[4/3] bg-[linear-gradient(135deg,rgba(201,168,76,0.22),rgba(250,247,240,1))]" />
              )}
              <div className="space-y-3 p-6">
                <h3 className="text-xl font-semibold">{p.title}</h3>
                <p className="line-clamp-3 text-sm leading-6 text-[--color-muted-fg]">{p.summary}</p>
                <span className="inline-flex text-sm font-semibold text-[--color-primary]">Explore program</span>
              </div>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

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
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionIntro heading={data.heading} intro={data.intro} />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {posts.map((p, index) => (
          <ScrollReveal key={p.id} delay={index * 0.05}>
            <Link
              href={`/blog/${p.slug}`}
              className="group block overflow-hidden rounded-[calc(var(--radius-lg)+0.15rem)] border border-[--color-border] bg-[--color-card] shadow-[0_16px_54px_rgba(15,23,42,0.06)] transition hover:-translate-y-1"
            >
              {p.cover?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.cover.url} alt={p.cover.alt ?? p.title} className="aspect-[4/2.4] w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
              ) : null}
              <div className="space-y-3 p-6">
                {p.publishedAt ? (
                  <time className="text-xs font-semibold uppercase tracking-[0.22em] text-[--color-muted-fg]">
                    {new Date(p.publishedAt).toLocaleDateString()}
                  </time>
                ) : null}
                <h3 className="text-xl font-semibold">{p.title}</h3>
                {p.excerpt ? <p className="line-clamp-3 text-sm leading-6 text-[--color-muted-fg]">{p.excerpt}</p> : null}
                <span className="inline-flex text-sm font-semibold text-[--color-primary]">Read story</span>
              </div>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

async function FeatureSplitBlock({ data }: { data: Extract<Block, { type: "featureSplit" }>["data"] }) {
  const media = data.imageMediaId
    ? await db.media.findUnique({ where: { id: data.imageMediaId }, select: { url: true, alt: true } })
    : null;

  const image = (
    <ScrollReveal className="relative">
      {media?.url ? (
        <div className="overflow-hidden rounded-[calc(var(--radius-lg)+0.35rem)] border border-[--color-border] shadow-[0_28px_100px_rgba(15,23,42,0.12)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={media.url} alt={media.alt ?? data.heading} className="aspect-[4/3.3] w-full object-cover" />
        </div>
      ) : (
        <div className="aspect-[4/3.3] rounded-[calc(var(--radius-lg)+0.35rem)] bg-[linear-gradient(145deg,rgba(201,168,76,0.18),rgba(250,247,240,1))]" />
      )}
    </ScrollReveal>
  );

  const copy = (
    <ScrollReveal>
      <div className="space-y-5">
        {data.eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[--color-muted-fg]">{data.eyebrow}</p>
        ) : null}
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{data.heading}</h2>
        <p className="text-base leading-8 text-[--color-muted-fg]">{data.body}</p>
        {data.ctaLabel && data.ctaHref ? (
          <Link href={data.ctaHref} className="inline-flex items-center rounded-[--radius-md] border border-[--color-border] bg-white px-5 py-3 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5">
            {data.ctaLabel}
          </Link>
        ) : null}
      </div>
    </ScrollReveal>
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
        {data.reverse ? image : copy}
        {data.reverse ? copy : image}
      </div>
    </section>
  );
}

function ActionCardsBlock({ data }: { data: Extract<Block, { type: "actionCards" }>["data"] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionIntro heading={data.heading} intro={data.intro} />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {data.items.map((item, index) => (
          <ScrollReveal key={`${item.title}-${index}`} delay={index * 0.05}>
            <Link
              href={item.href}
              className="group block rounded-[calc(var(--radius-lg)+0.1rem)] border border-[--color-border] bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(250,247,240,0.92))] p-6 shadow-[0_16px_54px_rgba(15,23,42,0.06)] transition hover:-translate-y-1"
            >
              <div className="mb-5 h-12 w-12 rounded-2xl bg-[--color-primary]/12 ring-1 ring-[--color-primary]/10" />
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[--color-muted-fg]">{item.body}</p>
              <span className="mt-6 inline-flex text-sm font-semibold text-[--color-primary]">{item.label}</span>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

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
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionIntro heading={data.heading} intro={data.intro} />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {events.map((event, index) => (
          <ScrollReveal key={event.id} delay={index * 0.05}>
            <Link
              href={`/events/${event.slug}`}
              className="group block overflow-hidden rounded-[calc(var(--radius-lg)+0.15rem)] border border-[--color-border] bg-[--color-card] shadow-[0_16px_54px_rgba(15,23,42,0.06)] transition hover:-translate-y-1"
            >
              {event.cover?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={event.cover.url} alt={event.cover.alt ?? event.title} className="aspect-[4/2.5] w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
              ) : null}
              <div className="space-y-3 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[--color-muted-fg]">
                  {new Date(event.startsAt).toLocaleDateString()}
                </p>
                <h3 className="text-xl font-semibold">{event.title}</h3>
                <p className="line-clamp-3 text-sm leading-6 text-[--color-muted-fg]">{event.description}</p>
                {event.location ? <p className="text-sm font-medium text-[--color-fg]">{event.location}</p> : null}
              </div>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

async function PartnerLogosBlock({ data }: { data: Extract<Block, { type: "partnerLogos" }>["data"] }) {
  if (data.mediaIds.length === 0) return null;
  const logos = await db.media.findMany({
    where: { id: { in: data.mediaIds } },
    select: { id: true, url: true, alt: true },
  });
  const ordered = data.mediaIds.map((id) => logos.find((item) => item.id === id)).filter(Boolean) as typeof logos;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <ScrollReveal>
        <div className="rounded-[calc(var(--radius-lg)+0.2rem)] border border-[--color-border] bg-[linear-gradient(180deg,rgba(250,247,240,0.85),rgba(255,255,255,0.96))] px-6 py-8 shadow-[0_18px_60px_rgba(15,23,42,0.05)] sm:px-8">
          <SectionIntro heading={data.heading} intro={data.intro} centered compact />
          <div className="grid grid-cols-2 items-center gap-5 md:grid-cols-4">
            {ordered.map((logo) => (
              <div key={logo.id} className="flex min-h-24 items-center justify-center rounded-[--radius-md] bg-white px-5 py-4 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo.url} alt={logo.alt ?? ""} className="max-h-14 w-auto object-contain opacity-90 grayscale transition hover:grayscale-0" />
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

function SectionIntro({
  heading,
  intro,
  centered = false,
  compact = false,
}: {
  heading?: string;
  intro?: string;
  centered?: boolean;
  compact?: boolean;
}) {
  if (!heading && !intro) return null;

  return (
    <ScrollReveal className={centered ? "mb-8 text-center" : "mb-8"}>
      {heading ? <h2 className={`text-3xl font-semibold tracking-tight ${compact ? "" : "sm:text-4xl"}`}>{heading}</h2> : null}
      {intro ? (
        <p className={`mt-3 max-w-2xl text-[--color-muted-fg] ${centered ? "mx-auto" : ""}`}>{intro}</p>
      ) : null}
    </ScrollReveal>
  );
}
