import Link from "next/link";
import { db } from "@/lib/db";
import { blocksSchema, type Block } from "@/lib/blocks/types";

/**
 * Server Component that renders a block array.
 *
 * Safe by construction: input is validated with blocksSchema at the
 * boundary so a corrupt JSON blob can't crash the renderer. Any block
 * that fails validation is silently dropped (logged in dev).
 */
export async function BlockRenderer({ blocks, orgId }: { blocks: unknown; orgId: string }) {
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
        <BlockSwitch key={b.id} block={b} orgId={orgId} />
      ))}
    </>
  );
}

async function BlockSwitch({ block, orgId }: { block: Block; orgId: string }) {
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
      return <ProgramGridBlock data={block.data} orgId={orgId} />;
    case "postList":
      return <PostListBlock data={block.data} orgId={orgId} />;
  }
}

// ─── Individual block components ─────────────────────────────

function HeroBlock({ data }: { data: Extract<Block, { type: "hero" }>["data"] }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-12">
        <div className="flex-1 space-y-5">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            {data.heading}
          </h1>
          {data.subheading ? (
            <p className="max-w-prose text-lg text-[--color-muted-fg]">{data.subheading}</p>
          ) : null}
          {data.ctaLabel && data.ctaHref ? (
            <Link
              href={data.ctaHref}
              className="inline-flex items-center rounded-[--radius-md] bg-[--color-primary] px-5 py-3 font-medium text-[--color-primary-fg] transition hover:opacity-90"
            >
              {data.ctaLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function RichTextBlock({ data }: { data: Extract<Block, { type: "richText" }>["data"] }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <div
        className="prose prose-slate max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: data.html }}
      />
    </section>
  );
}

function CtaBlock({ data }: { data: Extract<Block, { type: "cta" }>["data"] }) {
  const variants = {
    primary: "bg-[--color-primary] text-[--color-primary-fg]",
    secondary: "bg-[--color-secondary] text-[--color-secondary-fg]",
    outline: "border border-[--color-border]",
  } as const;
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 text-center">
      <h2 className="text-3xl font-semibold tracking-tight">{data.heading}</h2>
      {data.body ? <p className="mt-3 text-[--color-muted-fg]">{data.body}</p> : null}
      <Link
        href={data.buttonHref}
        className={`mt-6 inline-flex items-center rounded-[--radius-md] px-5 py-3 font-medium transition hover:opacity-90 ${variants[data.variant]}`}
      >
        {data.buttonLabel}
      </Link>
    </section>
  );
}

function StatsBlock({ data }: { data: Extract<Block, { type: "stats" }>["data"] }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      {data.heading ? (
        <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight">{data.heading}</h2>
      ) : null}
      <dl className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
        {data.items.map((item, i) => (
          <div key={i} className="space-y-1">
            <dt className="text-sm uppercase tracking-wide text-[--color-muted-fg]">{item.label}</dt>
            <dd className="text-3xl font-semibold">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

async function GalleryBlock({ data }: { data: Extract<Block, { type: "gallery" }>["data"] }) {
  if (data.mediaIds.length === 0) return null;
  const items = await db.media.findMany({
    where: { id: { in: data.mediaIds } },
    select: { id: true, url: true, alt: true, width: true, height: true },
  });
  const ordered = data.mediaIds.map((id) => items.find((m) => m.id === id)).filter(Boolean) as typeof items;
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      {data.heading ? (
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">{data.heading}</h2>
      ) : null}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {ordered.map((m) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={m.id}
            src={m.url}
            alt={m.alt ?? ""}
            loading="lazy"
            className="aspect-square w-full rounded-[--radius-md] object-cover"
          />
        ))}
      </div>
    </section>
  );
}

function DonateCtaBlock({ data }: { data: Extract<Block, { type: "donateCta" }>["data"] }) {
  const href = data.campaignSlug ? `/donate/${data.campaignSlug}` : "/donate";
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 text-center">
      <div className="rounded-[--radius-lg] bg-[--color-primary] p-10 text-[--color-primary-fg]">
        <h2 className="text-3xl font-semibold tracking-tight">{data.heading}</h2>
        {data.body ? <p className="mt-3 opacity-90">{data.body}</p> : null}
        <Link
          href={href}
          className="mt-6 inline-flex items-center rounded-[--radius-md] bg-[--color-primary-fg] px-5 py-3 font-medium text-[--color-primary]"
        >
          {data.buttonLabel}
        </Link>
      </div>
    </section>
  );
}

async function ProgramGridBlock({
  data,
  orgId,
}: {
  data: Extract<Block, { type: "programGrid" }>["data"];
  orgId: string;
}) {
  const programs = await db.program.findMany({
    where: { organizationId: orgId, status: "PUBLISHED" },
    orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
    take: data.limit,
    select: { id: true, slug: true, title: true, summary: true },
  });
  if (programs.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      {data.heading ? (
        <h2 className="mb-8 text-2xl font-semibold tracking-tight">{data.heading}</h2>
      ) : null}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {programs.map((p) => (
          <Link
            key={p.id}
            href={`/programs/${p.slug}`}
            className="rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] p-6 transition hover:shadow-sm"
          >
            <h3 className="text-lg font-semibold">{p.title}</h3>
            <p className="mt-2 line-clamp-3 text-sm text-[--color-muted-fg]">{p.summary}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

async function PostListBlock({
  data,
  orgId,
}: {
  data: Extract<Block, { type: "postList" }>["data"];
  orgId: string;
}) {
  const posts = await db.post.findMany({
    where: { organizationId: orgId, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: data.limit,
    select: { id: true, slug: true, title: true, excerpt: true, publishedAt: true },
  });
  if (posts.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      {data.heading ? (
        <h2 className="mb-8 text-2xl font-semibold tracking-tight">{data.heading}</h2>
      ) : null}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {posts.map((p) => (
          <Link
            key={p.id}
            href={`/blog/${p.slug}`}
            className="rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] p-5 transition hover:shadow-sm"
          >
            {p.publishedAt ? (
              <time className="text-xs text-[--color-muted-fg]">
                {new Date(p.publishedAt).toLocaleDateString()}
              </time>
            ) : null}
            <h3 className="mt-1 text-lg font-semibold">{p.title}</h3>
            {p.excerpt ? (
              <p className="mt-2 line-clamp-3 text-sm text-[--color-muted-fg]">{p.excerpt}</p>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
