import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { getPublishedPostBySlug } from "@/lib/services/posts";

export async function generateStaticParams() {
  try {
    const items = await db.post.findMany({
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
    const p = await getPublishedPostBySlug(slug);
    return {
      title: p.title,
      description: p.excerpt ?? undefined,
      openGraph: {
        title: p.title,
        description: p.excerpt ?? undefined,
        type: "article",
        url: `${APP_URL}/blog/${slug}`,
        images: [{ url: DEFAULT_OG, width: 1200, height: 630, alt: "Gloford Foundation" }],
      },
      twitter: { card: "summary_large_image" },
    };
  } catch {
    return {};
  }
}

export default async function PostDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let post;
  try {
    post = await getPublishedPostBySlug(slug);
  } catch {
    notFound();
  }

  return (
    <article>
      <header className="mx-auto max-w-3xl px-4 py-10">
        {post.publishedAt ? (
          <time className="text-xs uppercase tracking-wide text-[var(--color-muted-fg)]">
            {new Date(post.publishedAt).toLocaleDateString()}
          </time>
        ) : null}
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{post.title}</h1>
        {post.author?.name ? (
          <p className="mt-3 text-sm text-[var(--color-muted-fg)]">By {post.author.name}</p>
        ) : null}
        {post.tags.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((pt) => (
              <li key={pt.tag.id} className="rounded-full bg-[var(--color-muted)] px-3 py-1 text-xs">
                {pt.tag.name}
              </li>
            ))}
          </ul>
        ) : null}
      </header>
      <BlockRenderer blocks={post.body} />
    </article>
  );
}
