import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { getPublishedCollectionPage } from "@/lib/services/pages";
import { JsonLd } from "@/components/seo/JsonLd";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const page = await getPublishedCollectionPage("impactStory", slug);
    const title = page.seoTitle ?? page.title;
    const description = page.seoDesc ?? undefined;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        url: `${APP_URL}/impact-stories/${slug}`,
        images: [{ url: "/logo.png", width: 512, height: 512, alt: "Gloford" }],
      },
      twitter: { card: "summary_large_image" },
    };
  } catch {
    return {};
  }
}

export default async function ImpactStoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  try {
    const page = await getPublishedCollectionPage("impactStory", slug);
    return (
      <>
        <JsonLd
          data={[
            articleJsonLd({
              title: page.title,
              path: `/impact-stories/${slug}`,
              description: page.seoDesc,
              publishedAt: page.publishedAt,
            }),
            breadcrumbJsonLd([
              { name: "Home", href: "/" },
              { name: "Impact Stories", href: "/impact-stories" },
              { name: page.title, href: `/impact-stories/${slug}` },
            ]),
          ]}
        />
        <BlockRenderer blocks={page.blocks} />
      </>
    );
  } catch {
    notFound();
  }
}
