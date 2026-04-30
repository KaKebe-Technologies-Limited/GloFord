import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { getBrand } from "@/config/brand";
import { NewsletterForm } from "./NewsletterForm";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MapPin, Phone, Mail } from "lucide-react";

export async function PublicFooter() {
  const t = await getTranslations("public.footer");
  const year = new Date().getFullYear();

  const [footerRows, settings] = await Promise.all([
    db.navItem
      .findMany({
        where: { location: "FOOTER", isActive: true },
        orderBy: { order: "asc" },
        select: { id: true, label: true, href: true },
      })
      .catch(() => []),
    db.siteSettings
      .findUnique({
        where: { id: "singleton" },
        select: { siteName: true, contact: true, socials: true },
      })
      .catch(() => null),
  ]);

  const brand = getBrand();
  const siteName = settings?.siteName ?? brand.name;
  const contact = (settings?.contact as Record<string, string> | null) ?? {};
  const socials = (settings?.socials as Record<string, string> | null) ?? {};

  const quickLinks =
    footerRows.length > 0
      ? footerRows
          .filter((n) => n.href)
          .map((n) => ({ href: n.href!, label: n.label }))
      : [
          { href: "/about", label: "About Us" },
          { href: "/programs", label: "Projects" },
          { href: "/blog", label: "News" },
          { href: "/events", label: "Events" },
          { href: "/contact", label: "Contact" },
        ];

  const socialLinks = [
    { key: "facebook", icon: "f", href: socials.facebook },
    { key: "twitter", icon: "𝕏", href: socials.twitter },
    { key: "instagram", icon: "ig", href: socials.instagram },
    { key: "linkedin", icon: "in", href: socials.linkedin },
    { key: "youtube", icon: "▶", href: socials.youtube },
  ] as const;

  return (
    <footer className="bg-[rgb(26_40_35)] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {/* Brand column */}
        <div className="space-y-5">
          <p className="text-xl font-bold">{siteName}</p>
          <p className="text-sm leading-relaxed text-white/70">
            {t("tagline")}
          </p>
          <div className="flex items-center gap-3">
            {socialLinks.map(({ key, icon, href }) => (
              <a
                key={key}
                href={href ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-xs text-white/60 transition hover:border-white/50 hover:text-white"
                aria-label={t(`social.${key}` as Parameters<typeof t>[0])}
              >
                {icon}
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <nav aria-label={t("quickLinks")} className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wider">{t("quickLinks")}</p>
          <ul className="space-y-2.5">
            {quickLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="flex items-center gap-2 text-sm text-white/70 transition hover:text-white">
                  <span className="text-white/40">&rsaquo;</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Get in Touch */}
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wider">{t("getInTouch")}</p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm text-white/70">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
              <span>{contact.address ?? t("defaultAddress")}</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-white/70">
              <Phone className="h-4 w-4 shrink-0 text-[var(--color-accent)]" />
              <a href={`tel:${contact.phone ?? "+256700000000"}`} className="hover:text-white">
                {contact.phone ?? t("defaultPhone")}
              </a>
            </li>
            <li className="flex items-center gap-3 text-sm text-white/70">
              <Mail className="h-4 w-4 shrink-0 text-[var(--color-accent)]" />
              <a href={`mailto:${contact.email ?? "info@gloford.org"}`} className="hover:text-white">
                {contact.email ?? t("defaultEmail")}
              </a>
            </li>
          </ul>
        </div>

        {/* Newsletter */}
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wider">{t("stayConnected")}</p>
          <p className="text-sm text-white/70">{t("newsletterDesc")}</p>
          <NewsletterForm source="footer" />
          <p className="text-xs text-white/50">{t("privacyNote")}</p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <span className="text-xs text-white/50">
            &copy; {year} {siteName}. {t("rights")}
          </span>
          <div className="flex items-center gap-4 text-xs text-white/50">
            <Link href="/privacy" className="hover:text-white/70">{t("privacyPolicy")}</Link>
            <Link href="/terms" className="hover:text-white/70">{t("termsOfService")}</Link>
            <LocaleSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}
