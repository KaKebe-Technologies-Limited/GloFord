import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { getBrand } from "@/config/brand";
import { MobileNav } from "./MobileNav";
import { PublicNav, type NavTreeItem } from "./PublicNav";

export async function PublicHeader() {
  const t = await getTranslations("public.nav");

  const [navRows, settings] = await Promise.all([
    db.navItem
      .findMany({
        where: { location: "HEADER", isActive: true, parentId: null },
        orderBy: { order: "asc" },
        select: {
          id: true,
          label: true,
          href: true,
          children: {
            where: { isActive: true },
            orderBy: { order: "asc" },
            select: { id: true, label: true, href: true },
          },
        },
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

  const fallback: NavTreeItem[] = [
    { id: "home", href: "/", label: t("home"), children: [] },
    {
      id: "about",
      href: "/about",
      label: "About Us",
      children: [
        { id: "who-we-are", href: "/who-we-are", label: "Who We Are" },
        { id: "leadership", href: "/leadership", label: "Leadership" },
        { id: "partners", href: "/partners", label: "Partners" },
      ],
    },
    {
      id: "mission",
      href: "/mission",
      label: "Mission & Impact",
      children: [
        { id: "mission-page", href: "/mission", label: "Our Mission" },
        { id: "reports", href: "/reports", label: "Reports & Accountability" },
      ],
    },
    { id: "programs", href: "/programs", label: t("programs"), children: [] },
    {
      id: "involved",
      href: "/volunteer",
      label: "Get Involved",
      children: [
        { id: "volunteer", href: "/volunteer", label: "Volunteer" },
        { id: "careers", href: "/careers", label: "Careers" },
        { id: "internships", href: "/internships", label: "Internships" },
      ],
    },
    {
      id: "media",
      href: "/blog",
      label: "Media",
      children: [
        { id: "blog", href: "/blog", label: t("blog") },
        { id: "events", href: "/events", label: t("events") },
        { id: "newsroom", href: "/newsroom", label: "Newsroom" },
      ],
    },
    { id: "contact", href: "/contact", label: t("contact"), children: [] },
  ];

  const items: NavTreeItem[] =
    navRows.length > 0
      ? navRows.map((row) => ({
          id: row.id,
          href: row.href ?? "#",
          label: row.label,
          children: row.children.filter((child) => child.href).map((child) => ({
            id: child.id,
            href: child.href ?? "#",
            label: child.label,
          })),
        }))
      : fallback;

  return (
    <header className="sticky top-0 z-40 border-b border-[--color-border] bg-white/72 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label={`${siteName} home`}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={siteName} className="h-10 w-auto" />
          ) : null}
          <div>
            <span className="block text-lg font-semibold leading-tight">{siteName}</span>
            <span className="hidden text-xs uppercase tracking-[0.22em] text-[--color-muted-fg] sm:block">
              Community-led impact
            </span>
          </div>
        </Link>

        <PublicNav items={items} />

        <div className="hidden lg:block">
          <Link
            href="/donate"
            className="inline-flex items-center rounded-full bg-[--color-primary] px-5 py-2.5 text-sm font-semibold text-[--color-primary-fg] shadow-[0_16px_44px_rgba(201,168,76,0.26)] transition hover:-translate-y-0.5"
          >
            {t("donate")}
          </Link>
        </div>

        <MobileNav items={items} donateLabel={t("donate")} />
      </div>
    </header>
  );
}
