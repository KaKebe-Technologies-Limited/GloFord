import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { ArrowRight, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog",
  description: "Stories, updates, and announcements from our programs and community.",
};

export default async function BlogIndex() {
  const posts = await db.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      publishedAt: true,
      cover: { select: { url: true, alt: true } },
    },
  });

  const [featured, ...rest] = posts;

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[rgb(248_250_249)] to-[rgb(240_247_244)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
                Our Blog
              </p>
              <h1 className="font-display text-4xl font-bold text-[var(--color-fg)] sm:text-5xl">
                Stories & Updates
              </h1>
              <p className="mt-4 text-lg text-[var(--color-muted-fg)]">
                News, insights, and stories from our programs and the
                communities we serve.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BookOpen className="mb-4 h-12 w-12 text-[rgb(var(--token-muted-fg)/0.30)]" />
              <p className="text-[var(--color-muted-fg)]">
                Posts will appear here once published.
              </p>
            </div>
          ) : (
            <>
              {/* Featured Post */}
              {featured && (
                <ScrollReveal>
                  <Link
                    href={`/blog/${featured.slug}`}
                    className="group mb-16 grid overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm transition hover:shadow-xl md:grid-cols-2"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-[rgb(248_250_249)] md:aspect-auto md:min-h-[360px]">
                      {featured.cover?.url ? (
                        <Image
                          src={featured.cover.url}
                          alt={featured.cover.alt ?? featured.title}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          priority
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <BookOpen className="h-16 w-16 text-[rgb(var(--token-muted-fg)/0.20)]" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center p-8 md:p-12">
                      <span className="mb-3 inline-block w-fit rounded-full bg-[rgb(var(--token-primary)/0.10)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
                        Featured
                      </span>
                      {featured.publishedAt && (
                        <time className="text-sm text-[var(--color-muted-fg)]">
                          {new Date(featured.publishedAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </time>
                      )}
                      <h2 className="mt-2 font-display text-2xl font-bold text-[var(--color-fg)] sm:text-3xl">
                        {featured.title}
                      </h2>
                      {featured.excerpt && (
                        <p className="mt-4 text-base leading-relaxed text-[var(--color-muted-fg)] line-clamp-3">
                          {featured.excerpt}
                        </p>
                      )}
                      <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
                        Read Article <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                </ScrollReveal>
              )}

              {/* Remaining Posts Grid */}
              {rest.length > 0 && (
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post, i) => (
                    <ScrollReveal key={post.id} delay={i * 0.05}>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="group block overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm transition hover:shadow-xl"
                      >
                        <div className="relative aspect-[16/9] overflow-hidden bg-[rgb(248_250_249)]">
                          {post.cover?.url ? (
                            <Image
                              src={post.cover.url}
                              alt={post.cover.alt ?? post.title}
                              fill
                              className="object-cover transition duration-500 group-hover:scale-105"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <BookOpen className="h-10 w-10 text-[rgb(var(--token-muted-fg)/0.30)]" />
                            </div>
                          )}
                        </div>
                        <div className="p-6">
                          {post.publishedAt && (
                            <time className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-fg)]">
                              {new Date(post.publishedAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </time>
                          )}
                          <h2 className="mt-2 text-lg font-bold text-[var(--color-fg)] line-clamp-2">
                            {post.title}
                          </h2>
                          {post.excerpt && (
                            <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-fg)] line-clamp-2">
                              {post.excerpt}
                            </p>
                          )}
                          <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)]">
                            Read More{" "}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </Link>
                    </ScrollReveal>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
