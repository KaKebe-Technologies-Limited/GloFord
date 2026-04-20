import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MobileNav } from "./MobileNav";

const LINKS = [
  { href: "/", key: "home" },
  { href: "/about", key: "about" },
  { href: "/programs", key: "programs" },
  { href: "/blog", key: "blog" },
  { href: "/events", key: "events" },
  { href: "/contact", key: "contact" },
] as const;

export async function PublicHeader() {
  const t = await getTranslations("public.nav");
  const items = LINKS.map((l) => ({ href: l.href, label: t(l.key) }));

  return (
    <header className="sticky top-0 z-40 border-b border-[--color-border] bg-[--color-bg]/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-semibold tracking-tight" aria-label="Gloford home">
          Gloford
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
            {await getTranslations("public.nav").then((f) => f("donate"))}
          </Link>
        </div>
        <MobileNav items={items} donateLabel={t("donate")} />
      </div>
    </header>
  );
}
