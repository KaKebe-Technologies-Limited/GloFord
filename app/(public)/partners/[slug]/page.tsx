import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { getPublishedCollectionPage } from "@/lib/services/pages";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const page = await getPublishedCollectionPage("partner", slug);
    return {
      title: page.seoTitle ?? page.title,
      description: page.seoDesc ?? undefined,
    };
  } catch {
    return {};
  }
}

export default async function PartnerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  try {
    const page = await getPublishedCollectionPage("partner", slug);
    return <BlockRenderer blocks={page.blocks} />;
  } catch {
    notFound();
  }
}
