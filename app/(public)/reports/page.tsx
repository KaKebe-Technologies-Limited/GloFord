import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { getCollectionConfig, toCollectionPath } from "@/lib/pages/collections";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";
const DEFAULT_OG = `${APP_URL}/seed-images/gloford/hero-community.jpg`;

export const metadata: Metadata = {
  title: "Reports & Accountability",
  description: "Transparency reports, annual summaries, and accountability documents.",
  openGraph: {
    title: "Reports & Accountability",
    description: "Transparency reports, annual summaries, and accountability documents.",
    type: "website",
    url: `${APP_URL}/reports`,
    images: [{ url: DEFAULT_OG, width: 1200, height: 630, alt: "Gloford Foundation" }],
  },
  twitter: { card: "summary_large_image", title: "Reports & Accountability" },
};

export default async function ReportsPage() {
  const config = getCollectionConfig("report");
  const rows = await db.page.findMany({
    where: { status: "PUBLISHED", slug: { startsWith: config.prefix } },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    select: { id: true, slug: true, title: true, seoDesc: true },
  });

  return (
    <>
      <section className="w-full bg-[linear-gradient(180deg,rgba(250,247,240,0.9),rgba(255,255,255,1))] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Reports & Accountability</h1>
            <p className="mt-4 max-w-2xl text-lg text-[var(--color-muted-fg)]">
              We are committed to transparency, stewardship, and honest reporting. Below you will find our annual reports, financial summaries, and impact assessments.
            </p>
          </ScrollReveal>
        </div>
      </section>
      <section className="w-full px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {rows.length === 0 ? (
            <p className="text-[var(--color-muted-fg)]">Reports will be published here. Check back soon.</p>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {rows.map((row, i) => (
                <ScrollReveal key={row.id} delay={i * 0.05}>
                  <Link
                    href={toCollectionPath("report", row.slug)}
                    className="group block rounded-[calc(var(--radius-lg)+0.15rem)] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[0_16px_54px_rgba(15,23,42,0.06)] transition hover:-translate-y-1"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgb(var(--token-primary)/0.12)] text-[var(--color-primary)]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <h2 className="text-xl font-semibold">{row.title}</h2>
                    {row.seoDesc ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--color-muted-fg)]">{row.seoDesc}</p> : null}
                    <span className="mt-4 inline-flex text-sm font-semibold text-[var(--color-primary)]">Open report</span>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
