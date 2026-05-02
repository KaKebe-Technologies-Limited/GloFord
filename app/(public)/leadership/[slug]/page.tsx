import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { getPublishedCollectionPage } from "@/lib/services/pages";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";
const DEFAULT_OG = `${APP_URL}/seed-images/gloford/hero-community.jpg`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const page = await getPublishedCollectionPage("team", slug);
    const title = page.seoTitle ?? page.title;
    const description = page.seoDesc ?? undefined;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        url: `${APP_URL}/leadership/${slug}`,
        images: [{ url: DEFAULT_OG, width: 1200, height: 630, alt: "Gloford Foundation" }],
      },
      twitter: { card: "summary_large_image" },
    };
  } catch {
    return {};
  }
}

export default async function LeadershipProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  try {
    const page = await getPublishedCollectionPage("team", slug);
    return <BlockRenderer blocks={page.blocks} />;
  } catch {
    notFound();
  }
}
