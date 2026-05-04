import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { getPublishedPageBySlug } from "@/lib/services/pages";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";
const DEFAULT_OG = `${APP_URL}/seed-images/gloford/hero-community.jpg`;

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  try {
    const page = await getPublishedPageBySlug(slug);
    const title = page.seoTitle ?? page.title;
    const description = page.seoDesc ?? undefined;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        url: `${APP_URL}/${slug}`,
        images: [{ url: "/logo.png", width: 512, height: 512, alt: "Gloford" }],
      },
      twitter: { card: "summary_large_image" },
    };
  } catch {
    return {};
  }
}

export default async function DynamicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let page;
  try {
    page = await getPublishedPageBySlug(slug);
  } catch {
    notFound();
  }

  return (
    <article>
      <BlockRenderer blocks={page.blocks} />
    </article>
  );
}
