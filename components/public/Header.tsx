import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { getBrand } from "@/config/brand";
import { MobileNav } from "./MobileNav";

export async function PublicHeader() {
  const t = await getTranslations("public.nav");

  const [navRows, settings] = await Promise.all([
    db.navItem
      .findMany({
        where: { location: "HEADER", isActive: true },
        orderBy: { order: "asc" },
        select: { id: true, label: true, href: true },
      })
      .catch(() => []),
    db.siteSettings
      .findUnique({
        where: { id: "singleton" },
        select: { siteName: true, logoUrl: true },
      })
      .catch(() => null),
  ]);

  const brand = getBrand();
  const siteName = settings?.siteName ?? brand.name;
  const logoUrl = settings?.logoUrl ?? brand.logoUrl;

  const items =
    navRows.length > 0
      ? navRows
          .filter((n) => n.href)
          .map((n) => ({ href: n.href!, label: n.label }))
      : [
          { href: "/", label: t("home") },
          { href: "/about", label: t("about") },
          { href: "/programs", label: t("programs") },
          { href: "/blog", label: t("blog") },
          { href: "/events", label: t("events") },
          { href: "/contact", label: t("contact") },
        ];

  return (
    <header className="sticky top-0 z-40 border-b border-[--color-border] bg-[--color-bg]/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
          aria-label={`${siteName} home`}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={siteName} className="h-7 w-auto" />
          ) : null}
          <span>{siteName}</span>
        </Link>
        <nav aria-label="Primary" className="hidden gap-6 md:flex">
          {items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className="text-sm text-[--color-fg]/80 transition hover:text-[--color-fg]"
            >
              {i.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:block">
          <Link
            href="/donate"
            className="inline-flex items-center rounded-[--radius-md] bg-[--color-primary] px-4 py-2 text-sm font-medium text-[--color-primary-fg] transition hover:opacity-90"
          >
            {t("donate")}
          </Link>
        </div>
        <MobileNav items={items} donateLabel={t("donate")} />
      </div>
    </header>
  );
}
