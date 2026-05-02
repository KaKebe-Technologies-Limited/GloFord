import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { blocksSchema } from "@/lib/blocks/types";
import { getCollectionConfig, toCollectionPath } from "@/lib/pages/collections";
import { getActiveTestimonials } from "@/lib/services/testimonials";
import { getActiveFaqs } from "@/lib/services/faqs";
import { PartnerApplicationForm } from "./PartnerApplicationForm";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";
const DEFAULT_OG = `${APP_URL}/seed-images/gloford/hero-community.jpg`;

export const metadata: Metadata = {
  title: "Our Partners",
  description:
    "Organizations and institutions collaborating with us to strengthen communities. Apply to become a partner.",
  openGraph: {
    title: "Our Partners",
    description:
      "Organizations and institutions collaborating with us to strengthen communities. Apply to become a partner.",
    type: "website",
    url: `${APP_URL}/partners`,
    images: [{ url: DEFAULT_OG, width: 1200, height: 630, alt: "Gloford Foundation" }],
  },
  twitter: { card: "summary_large_image", title: "Our Partners" },
};

function findPreviewImageId(blocks: unknown): string | null {
  const parsed = blocksSchema.safeParse(blocks);
  if (!parsed.success) return null;
  for (const block of parsed.data) {
    if ("imageMediaId" in block.data && typeof block.data.imageMediaId === "string" && block.data.imageMediaId) return block.data.imageMediaId;
    if ("mediaIds" in block.data && Array.isArray(block.data.mediaIds) && block.data.mediaIds[0]) return block.data.mediaIds[0];
  }
  return null;
}

export default async function PartnersPage() {
  const config = getCollectionConfig("partner");
  const [rows, testimonials, faqs] = await Promise.all([
    db.page.findMany({
      where: { status: "PUBLISHED", slug: { startsWith: config.prefix } },
      orderBy: [{ updatedAt: "desc" }],
      select: { id: true, slug: true, title: true, seoDesc: true, blocks: true },
    }),
    getActiveTestimonials(),
    getActiveFaqs("partnerships"),
  ]);

  const imageIds = rows.map((r) => findPreviewImageId(r.blocks)).filter(Boolean) as string[];
  const media = imageIds.length
    ? await db.media.findMany({ where: { id: { in: imageIds } }, select: { id: true, url: true, alt: true } })
    : [];
  const mediaMap = new Map(media.map((m) => [m.id, m]));

  return (
    <>
      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-[rgb(248_250_249)] via-white to-[rgb(240_247_244)] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="relative mx-auto max-w-7xl">
          <ScrollReveal>
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              Collaboration
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-[var(--color-fg)] sm:text-5xl lg:text-6xl">
              Our Partners
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--color-muted-fg)]">
              We believe lasting change comes from collaboration. These
              organizations stand with us, bringing resources, expertise, and
              shared vision to communities across Uganda.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Current Partners Grid */}
      <section className="w-full bg-[var(--color-bg)] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Current Partners
            </h2>
          </ScrollReveal>

          {rows.length === 0 ? (
            <ScrollReveal>
              <p className="mt-8 text-[var(--color-muted-fg)]">
                Partner profiles coming soon.
              </p>
            </ScrollReveal>
          ) : (
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
              {rows.map((row, i) => {
                const preview = mediaMap.get(findPreviewImageId(row.blocks) ?? "");
                return (
                  <ScrollReveal key={row.id} delay={i * 0.05}>
                    <Link
                      href={toCollectionPath("partner", row.slug)}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-[0_16px_54px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 sm:flex-row"
                    >
                      {preview?.url ? (
                        <img
                          src={preview.url}
                          alt={preview.alt ?? row.title}
                          className="aspect-video w-full object-contain bg-white p-6 sm:aspect-square sm:w-48"
                        />
                      ) : (
                        <div className="aspect-video w-full bg-[linear-gradient(135deg,rgba(201,168,76,0.12),rgba(250,247,240,1))] sm:aspect-square sm:w-48" />
                      )}
                      <div className="flex flex-1 flex-col justify-center space-y-2 p-6">
                        <h3 className="text-xl font-semibold">{row.title}</h3>
                        {row.seoDesc ? (
                          <p className="line-clamp-3 text-sm leading-6 text-[var(--color-muted-fg)]">
                            {row.seoDesc}
                          </p>
                        ) : null}
                        <span className="inline-flex text-sm font-semibold text-[var(--color-primary)]">
                          Learn more
                        </span>
                      </div>
                    </Link>
                  </ScrollReveal>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="relative w-full overflow-hidden bg-gradient-to-br from-[rgb(248_250_249)] via-white to-[rgb(240_247_244)] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <ScrollReveal>
              <h2 className="font-display text-3xl font-bold tracking-tight text-[var(--color-fg)] sm:text-4xl">
                What Our Partners Say
              </h2>
            </ScrollReveal>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t, i) => (
                <ScrollReveal key={t.id} delay={i * 0.06}>
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-sm">
                    <svg
                      className="h-8 w-8 text-[rgb(var(--token-primary)/0.60)]"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11h4v10H0z" />
                    </svg>
                    <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted-fg)]">
                      {t.quote}
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                      {t.avatarUrl ? (
                        <img
                          src={t.avatarUrl}
                          alt={t.authorName}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgb(var(--token-primary)/0.10)] text-sm font-bold text-[var(--color-primary)]">
                          {t.authorName[0]}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-fg)]">
                          {t.authorName}
                        </p>
                        {(t.authorRole || t.authorOrg) && (
                          <p className="text-xs text-[var(--color-muted-fg)]">
                            {[t.authorRole, t.authorOrg]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Partnership Application */}
      <section className="w-full bg-[rgb(var(--token-muted)/0.30)] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <h2 className="text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Become a Partner
            </h2>
            <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-[var(--color-primary)]" />
            <p className="mx-auto mt-4 max-w-xl text-center text-[var(--color-muted-fg)]">
              Interested in partnering with us? Fill out the form below and our
              team will be in touch.
            </p>
          </ScrollReveal>
          <div className="mt-10">
            <PartnerApplicationForm />
          </div>
        </div>
      </section>

      {/* FAQs */}
      {faqs.length > 0 && (
        <section className="w-full bg-[var(--color-bg)] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <ScrollReveal>
              <h2 className="text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Partnership FAQs
              </h2>
              <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-[var(--color-primary)]" />
            </ScrollReveal>
            <div className="mt-12 space-y-4">
              {faqs.map((faq, i) => (
                <ScrollReveal key={faq.id} delay={i * 0.05}>
                  <details className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 transition-shadow hover:shadow-sm [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer items-center justify-between font-semibold">
                      {faq.question}
                      <svg
                        className="h-5 w-5 shrink-0 text-[var(--color-muted-fg)] transition-transform group-open:rotate-180"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m19.5 8.25-7.5 7.5-7.5-7.5"
                        />
                      </svg>
                    </summary>
                    <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted-fg)]">
                      {faq.answer}
                    </p>
                  </details>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
