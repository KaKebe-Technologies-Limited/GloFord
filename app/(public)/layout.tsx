import { PublicHeader } from "@/components/public/Header";
import { PublicFooter } from "@/components/public/Footer";

// All public pages read tenant data on every render (nav + content).
// We let unstable_cache handle the actual caching; dynamic is set to
// avoid Next trying to pre-render DB-backed pages at build.
export const dynamic = "force-dynamic";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[9999] focus:rounded focus:bg-[var(--color-primary)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--color-primary-fg)] focus:shadow-lg"
      >
        Skip to main content
      </a>
      <PublicHeader />
      <main id="main-content" className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
