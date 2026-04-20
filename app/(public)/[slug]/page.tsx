import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { getPublishedPageBySlug } from "@/lib/services/pages";

/**
 * Catch-all for slug-based Pages. Next.js tries nested routes first
 * (/programs, /blog, etc.), so this only fires for slugs that don't
 * collide with another route segment.
 *
 * The org is resolved from the single active organization — when
 * multi-tenant routing ships (host-based), swap this lookup.
 */

async function resolveOrg() {
  const org = await db.organization.findFirst({
    where: { isActive: true },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  return org;
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const org = await resolveOrg();
  if (!org) return {};
  try {
    const page = await getPublishedPageBySlug(org.id, slug);
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
  const org = await resolveOrg();
  if (!org) notFound();

  let page;
  try {
    page = await getPublishedPageBySlug(org.id, slug);
  } catch {
    notFound();
  }

  return (
    <article>
      <BlockRenderer blocks={page.blocks} orgId={org.id} />
    </article>
  );
}
