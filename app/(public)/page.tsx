import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function HomePage() {
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
            href="/programs"
            className="inline-flex items-center rounded-[--radius-md] border border-[--color-border] px-5 py-3 font-medium transition hover:bg-[--color-muted]"
          >
            Explore programs
          </Link>
        </div>
      </div>
      <div className="flex-1">
        <div className="aspect-[4/3] w-full rounded-[--radius-lg] bg-gradient-to-br from-[--color-primary] via-[--color-accent] to-[--color-secondary] opacity-90" />
      </div>
    </section>
  );
}
