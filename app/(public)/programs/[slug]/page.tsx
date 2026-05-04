import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { getPublishedProgramBySlug } from "@/lib/services/programs";
import { JsonLd } from "@/components/seo/JsonLd";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";

export async function generateStaticParams() {
  try {
    const items = await db.program.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true },
    });
    return items.map((item) => ({ slug: item.slug }));
  } catch {
    return [];
  }
}

export const revalidate = 3600; // ISR: revalidate every hour

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";
const DEFAULT_OG = `${APP_URL}/seed-images/gloford/hero-community.jpg`;

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  try {
    const p = await getPublishedProgramBySlug(slug);
    return {
      title: p.seoTitle ?? p.title,
      description: p.seoDesc ?? p.summary,
      openGraph: {
        title: p.seoTitle ?? p.title,
        description: p.seoDesc ?? p.summary ?? "",
        type: "article",
        url: `${APP_URL}/programs/${slug}`,
        images: p.cover?.url
          ? [{ url: p.cover.url, width: 1200, height: 630, alt: p.title }]
          : [{ url: "/logo.png", width: 512, height: 512, alt: "Gloford" }],
      },
      twitter: { card: "summary_large_image" },
    };
  } catch {
    return {};
  }
}

export default async function ProgramDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let program;
  try {
    program = await getPublishedProgramBySlug(slug);
  } catch {
    notFound();
  }

  return (
    <article>
      <JsonLd
        data={[
          articleJsonLd({
            title: program.title,
            path: `/programs/${slug}`,
            description: program.summary,
            coverUrl: program.cover?.url,
          }),
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Programs", href: "/programs" },
            { name: program.title, href: `/programs/${slug}` },
          ]),
        ]}
      />
      <section className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{program.title}</h1>
        <p className="mt-4 text-lg text-[var(--color-muted-fg)]">{program.summary}</p>
      </section>
      <BlockRenderer blocks={program.body} />
    </article>
  );
}
