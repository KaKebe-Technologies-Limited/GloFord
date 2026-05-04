import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { blocksSchema } from "@/lib/blocks/types";
import { getCollectionConfig, toCollectionPath } from "@/lib/pages/collections";
import { JsonLd } from "@/components/seo/JsonLd";
import { collectionPageJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";


export const metadata: Metadata = {
  title: "Impact Stories",
  description: "Success stories and community impact from our programs.",
  openGraph: {
    title: "Impact Stories",
    description: "Success stories and community impact from our programs.",
    type: "website",
    url: `${APP_URL}/impact-stories`,
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Gloford" }],
  },
  twitter: { card: "summary_large_image", title: "Impact Stories" },
};

function findPreviewImageId(blocks: unknown): string | null {
  const parsed = blocksSchema.safeParse(blocks);
  if (!parsed.success) return null;
  for (const block of parsed.data) {
    if ("imageMediaId" in block.data && typeof block.data.imageMediaId === "string" && block.data.imageMediaId) {
      return block.data.imageMediaId;
    }
    if ("mediaIds" in block.data && Array.isArray(block.data.mediaIds) && block.data.mediaIds[0]) {
      return block.data.mediaIds[0];
    }
  }
  return null;
}

export default async function ImpactStoriesPage() {
  const t = await getTranslations("public.impactStories");
  const config = getCollectionConfig("impactStory");
  const rows = await db.page.findMany({
    where: { status: "PUBLISHED", slug: { startsWith: config.prefix } },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    select: { id: true, slug: true, title: true, seoDesc: true, blocks: true },
  });

  const imageIds = rows.map((r) => findPreviewImageId(r.blocks)).filter(Boolean) as string[];
  const media = imageIds.length
    ? await db.media.findMany({ where: { id: { in: imageIds } }, select: { id: true, url: true, alt: true } })
    : [];
  const mediaMap = new Map(media.map((m) => [m.id, m]));

  return (
    <>
      <JsonLd
        data={[
          collectionPageJsonLd({
            name: "Impact Stories",
            path: "/impact-stories",
            description: "Success stories and community impact from our programs.",
          }),
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Impact Stories", href: "/impact-stories" },
          ]),
        ]}
      />

      <section className="w-full bg-[linear-gradient(180deg,rgba(250,247,240,0.9),rgba(255,255,255,1))] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t("heading")}</h1>
            <p className="mt-4 max-w-2xl text-lg text-[var(--color-muted-fg)]">
              {t("subheading")}
            </p>
          </ScrollReveal>
        </div>
      </section>
      <section className="w-full px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {rows.length === 0 ? (
            <p className="text-[var(--color-muted-fg)]">{t("empty")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {rows.map((row, i) => {
                const preview = mediaMap.get(findPreviewImageId(row.blocks) ?? "");
                return (
                  <ScrollReveal key={row.id} delay={i * 0.05}>
                    <Link
                      href={toCollectionPath("impactStory", row.slug)}
                      className="group block overflow-hidden rounded-[calc(var(--radius-lg)+0.15rem)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[0_16px_54px_rgba(15,23,42,0.06)] transition hover:-translate-y-1"
                    >
                      {preview?.url ? (
                        <img src={preview.url} alt={preview.alt ?? row.title} className="aspect-[4/2.7] w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                      ) : (
                        <div className="aspect-[4/2.7] bg-[linear-gradient(135deg,rgba(201,168,76,0.15),rgba(250,247,240,1))]" />
                      )}
                      <div className="space-y-3 p-6">
                        <h2 className="text-xl font-semibold">{row.title}</h2>
                        {row.seoDesc ? <p className="line-clamp-3 text-sm leading-6 text-[var(--color-muted-fg)]">{row.seoDesc}</p> : null}
                        <span className="inline-flex text-sm font-semibold text-[var(--color-primary)]">{t("readStory")}</span>
                      </div>
                    </Link>
                  </ScrollReveal>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
