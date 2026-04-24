import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { getPublishedPageBySlug } from "@/lib/services/pages";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  try {
    const page = await getPublishedPageBySlug(slug);
    return {
      title: page.seoTitle ?? page.title,
      description: page.seoDesc ?? undefined,
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
