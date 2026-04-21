import { PublicHeader } from "@/components/public/Header";
import { PublicFooter } from "@/components/public/Footer";

// All public pages read tenant data on every render (nav + content).
// We let unstable_cache handle the actual caching; dynamic is set to
// avoid Next trying to pre-render DB-backed pages at build.
export const dynamic = "force-dynamic";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
