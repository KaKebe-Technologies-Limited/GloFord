import Link from "next/link";
import { db } from "@/lib/db";
import { listPublishedPosts } from "@/lib/services/posts";

export const metadata = { title: "Blog" };

export default async function BlogIndex() {
  const org = await db.organization.findFirst({
    where: { isActive: true },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (!org) return null;
  const posts = await listPublishedPosts(org.id);

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <header className="mb-10 space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">Blog</h1>
        <p className="text-[--color-muted-fg]">Stories, updates, and announcements.</p>
      </header>
      {posts.length === 0 ? (
        <p className="text-[--color-muted-fg]">Posts will appear here once published.</p>
      ) : (
        <ul className="space-y-6">
          {posts.map((p) => (
            <li key={p.id}>
              <Link href={`/blog/${p.slug}`} className="block rounded-[--radius-lg] p-4 transition hover:bg-[--color-muted]">
                {p.publishedAt ? (
                  <time className="text-xs uppercase tracking-wide text-[--color-muted-fg]">
                    {new Date(p.publishedAt).toLocaleDateString()}
                  </time>
                ) : null}
                <h2 className="mt-1 text-2xl font-semibold">{p.title}</h2>
                {p.excerpt ? <p className="mt-2 text-[--color-muted-fg]">{p.excerpt}</p> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
