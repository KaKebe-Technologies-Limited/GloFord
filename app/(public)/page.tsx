import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { getPublishedPageBySlug } from "@/lib/services/pages";

/**
 * Home page.
 *
 * Primary path: render the Page row at slug="home" via BlockRenderer
 * — this is what the admin edits from /admin/pages. A client can drop
 * in any block composition: hero, programGrid, postList, donateCta, etc.
 *
 * Fallback: if no home page is seeded yet, render a minimal
 * placeholder hero that points to /admin/pages so operators know
 * where to go.
 */
export default async function HomePage() {
  try {
    const page = await getPublishedPageBySlug("home");
    return (
      <>
        <BlockRenderer blocks={page.blocks} />
      </>
    );
  } catch {
    return <Fallback />;
  }
}

async function Fallback() {
  const t = await getTranslations("public.hero");
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:py-24 md:flex-row md:items-center md:gap-12">
      <div className="flex-1 space-y-5">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl md:text-6xl">
          {t("heading")}
        </h1>
        <p className="max-w-prose text-lg text-[--color-muted-fg]">{t("subheading")}</p>
        <div className="flex gap-3">
          <Link
            href="/donate"
            className="inline-flex items-center rounded-[--radius-md] bg-[--color-primary] px-5 py-3 font-medium text-[--color-primary-fg] transition hover:opacity-90"
          >
            {t("cta")}
          </Link>
          <Link
            href="/admin/pages"
            className="inline-flex items-center rounded-[--radius-md] border border-[--color-border] px-5 py-3 font-medium transition hover:bg-[--color-muted]"
          >
            Edit home page
          </Link>
        </div>
      </div>
      <div className="flex-1">
        <div className="aspect-[4/3] w-full rounded-[--radius-lg] bg-gradient-to-br from-[--color-primary] via-[--color-accent] to-[--color-secondary] opacity-90" />
      </div>
    </section>
  );
}
