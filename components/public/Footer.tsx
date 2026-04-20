import { getTranslations } from "next-intl/server";

export async function PublicFooter() {
  const t = await getTranslations("public.footer");
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-[--color-border] bg-[--color-muted]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <p className="text-lg font-semibold">Gloford</p>
          <p className="mt-2 text-sm text-[--color-muted-fg]">
            Community partnerships for health, education, and resilience.
          </p>
        </div>
        <nav aria-label="Footer" className="space-y-2 text-sm">
          <p className="font-medium">Explore</p>
          <ul className="space-y-1 text-[--color-muted-fg]">
            <li><a href="/about" className="hover:underline">About</a></li>
            <li><a href="/programs" className="hover:underline">Programs</a></li>
            <li><a href="/blog" className="hover:underline">Blog</a></li>
            <li><a href="/events" className="hover:underline">Events</a></li>
          </ul>
        </nav>
        <nav aria-label="Support" className="space-y-2 text-sm">
          <p className="font-medium">Support</p>
          <ul className="space-y-1 text-[--color-muted-fg]">
            <li><a href="/donate" className="hover:underline">Donate</a></li>
            <li><a href="/contact" className="hover:underline">Contact</a></li>
          </ul>
        </nav>
        <div className="space-y-2 text-sm">
          <p className="font-medium">{t("newsletter")}</p>
          <p className="text-[--color-muted-fg]">Subscription form arrives in Phase 4.</p>
        </div>
      </div>
      <div className="border-t border-[--color-border] py-4 text-center text-xs text-[--color-muted-fg]">
        &copy; {year} Gloford. {t("rights")}
      </div>
    </footer>
  );
}
