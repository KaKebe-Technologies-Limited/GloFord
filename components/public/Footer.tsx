import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { NewsletterForm } from "./NewsletterForm";

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
            <li><Link href="/about" className="hover:underline">About</Link></li>
            <li><Link href="/programs" className="hover:underline">Programs</Link></li>
            <li><Link href="/blog" className="hover:underline">Blog</Link></li>
            <li><Link href="/events" className="hover:underline">Events</Link></li>
          </ul>
        </nav>
        <nav aria-label="Support" className="space-y-2 text-sm">
          <p className="font-medium">Support</p>
          <ul className="space-y-1 text-[--color-muted-fg]">
            <li><Link href="/donate" className="hover:underline">Donate</Link></li>
            <li><Link href="/contact" className="hover:underline">Contact</Link></li>
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
      <div className="border-t border-[--color-border] py-4 text-center text-xs text-[--color-muted-fg]">
        &copy; {year} Gloford. {t("rights")}
      </div>
    </footer>
  );
}
