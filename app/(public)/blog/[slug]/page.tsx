import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { getPublishedPostBySlug } from "@/lib/services/posts";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  try {
    const p = await getPublishedPostBySlug(slug);
    return { title: p.title, description: p.excerpt ?? undefined };
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
          <time className="text-xs uppercase tracking-wide text-[--color-muted-fg]">
            {new Date(post.publishedAt).toLocaleDateString()}
          </time>
        ) : null}
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{post.title}</h1>
        {post.author?.name ? (
          <p className="mt-3 text-sm text-[--color-muted-fg]">By {post.author.name}</p>
        ) : null}
        {post.tags.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((pt) => (
              <li key={pt.tag.id} className="rounded-full bg-[--color-muted] px-3 py-1 text-xs">
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
