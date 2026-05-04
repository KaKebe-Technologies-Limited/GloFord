import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PublicHeader } from "@/components/public/Header";
import { PublicFooter } from "@/components/public/Footer";

export default async function NotFound() {
  const t = await getTranslations("public.notFound");

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <PublicHeader />
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="max-w-md space-y-3 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-fg)]">{t("code")}</p>
          <h1 className="text-2xl font-semibold">{t("heading")}</h1>
          <p className="text-sm text-[var(--color-muted-fg)]">
            {t("description")}
          </p>
          <Link
            href="/"
            className="inline-block rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-muted)]"
          >
            {t("backToHome")}
          </Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
