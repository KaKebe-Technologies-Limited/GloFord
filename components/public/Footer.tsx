import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { getBrand } from "@/config/brand";
import { NewsletterForm } from "./NewsletterForm";
import { LocaleSwitcher } from "./LocaleSwitcher";

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

  const footerItems =
    footerRows.length > 0
      ? footerRows
          .filter((n) => n.href)
          .map((n) => ({ href: n.href!, label: n.label }))
      : [
          { href: "/about", label: "About" },
          { href: "/programs", label: "Programs" },
          { href: "/blog", label: "Blog" },
          { href: "/events", label: "Events" },
        ];

  return (
    <footer className="border-t border-[--color-border] bg-[--color-muted]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <p className="text-lg font-semibold">{siteName}</p>
          <p className="mt-2 text-sm text-[--color-muted-fg]">
            Community partnerships for health, education, and resilience.
          </p>
          {contact.email ? (
            <p className="mt-3 text-sm text-[--color-muted-fg]">
              <a href={`mailto:${contact.email}`} className="hover:underline">
                {contact.email}
              </a>
            </p>
          ) : null}
        </div>
        <nav aria-label="Footer" className="space-y-2 text-sm">
          <p className="font-medium">Explore</p>
          <ul className="space-y-1 text-[--color-muted-fg]">
            {footerItems.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="hover:underline">
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Support" className="space-y-2 text-sm">
          <p className="font-medium">Support</p>
          <ul className="space-y-1 text-[--color-muted-fg]">
            <li>
              <Link href="/donate" className="hover:underline">
                Donate
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:underline">
                Contact
              </Link>
            </li>
          </ul>
        </nav>
        <div className="space-y-2 text-sm">
          <p className="font-medium">{t("newsletter")}</p>
          <p className="text-xs text-[--color-muted-fg]">
            Stay in touch. We send occasional updates on programs and stories.
          </p>
          <NewsletterForm source="footer" />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4 border-t border-[--color-border] px-4 py-4 text-center text-xs text-[--color-muted-fg]">
        <span>
          &copy; {year} {siteName}. {t("rights")}
        </span>
        <LocaleSwitcher />
      </div>
    </footer>
  );
}
