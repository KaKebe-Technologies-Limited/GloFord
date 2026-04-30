import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { getBrand } from "@/config/brand";
import { MobileNav } from "./MobileNav";
import { PublicNav, type NavTreeItem } from "./PublicNav";
import { Phone, Mail, MapPin, Heart } from "lucide-react";

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
        select: { siteName: true, logoUrl: true, contact: true },
      })
      .catch(() => null),
  ]);

  const brand = getBrand();
  const siteName = settings?.siteName ?? brand.name;
  const logoUrl = settings?.logoUrl ?? brand.logoUrl;
  const contact = (settings?.contact as Record<string, string> | null) ?? {};

  const fallback: NavTreeItem[] = [
    { id: "home", href: "/", label: t("home"), children: [] },
    {
      id: "about",
      href: "/who-we-are",
      label: t("about"),
      children: [
        { id: "who-we-are", href: "/who-we-are", label: t("whoWeAre") },
        { id: "leadership", href: "/leadership", label: t("leadership") },
        { id: "history", href: "/history", label: t("ourHistory") },
        { id: "partners", href: "/partners", label: t("partners") },
      ],
    },
    {
      id: "work",
      href: "/programs",
      label: t("ourWork"),
      children: [
        { id: "approach", href: "/our-approach", label: t("ourApproach") },
        { id: "impact-stories", href: "/impact-stories", label: t("impactStories") },
        { id: "reports", href: "/reports", label: t("reports") },
      ],
    },
    { id: "programs", href: "/programs", label: t("programs"), children: [] },
    { id: "blog", href: "/blog", label: t("blog"), children: [] },
    {
      id: "involved",
      href: "/get-involved",
      label: t("getInvolved"),
      children: [
        { id: "volunteer", href: "/volunteer", label: t("volunteer") },
        { id: "careers", href: "/careers", label: t("careers") },
        { id: "internships", href: "/internships", label: t("internships") },
        { id: "partner", href: "/partner-with-us", label: t("partnerWithUs") },
        { id: "donate", href: "/donate", label: t("donate") },
      ],
    },
    {
      id: "media",
      href: "/events",
      label: t("media"),
      children: [
        { id: "events", href: "/events", label: t("events") },
        { id: "press", href: "/press", label: t("pressMedia") },
        { id: "gallery", href: "/gallery", label: t("gallery") },
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
    <header className="sticky top-0 z-40">
      {/* Top contact bar — always uses primary brand color */}
      <div className="hidden bg-[rgb(var(--token-primary))] text-white/90 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            {contact.phone ? (
              <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 hover:text-white">
                <Phone className="h-3 w-3" />
                <span>{contact.phone}</span>
              </a>
            ) : (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3 w-3" />
                <span>+256 700 000000</span>
              </span>
            )}
            {contact.email ? (
              <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 hover:text-white">
                <Mail className="h-3 w-3" />
                <span>{contact.email}</span>
              </a>
            ) : (
              <span className="flex items-center gap-1.5">
                <Mail className="h-3 w-3" />
                <span>info@gloford.org</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3" />
            <span>{contact.address ?? "Kampala, Uganda"}</span>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label={t("home_aria", { name: siteName })}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={siteName} className="h-12 w-auto" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)] text-lg font-bold text-white">
                {siteName.charAt(0)}
              </div>
            )}
            <span className="hidden text-lg font-bold tracking-tight text-[var(--color-fg)] sm:block">
              {siteName}
            </span>
          </Link>

          <PublicNav items={items} />

          <div className="hidden lg:block">
            <Link
              href="/donate"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg hover:brightness-110"
            >
              <Heart className="h-4 w-4" />
              {t("donate")}
            </Link>
          </div>

          <MobileNav items={items} donateLabel={t("donate")} />
        </div>
      </div>
    </header>
  );
}
