import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBrand } from "@/config/brand";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const session = await auth();
  const sp = await searchParams;
  if (session?.user?.id) redirect(sp.next ?? "/admin/dashboard");

  const t = await getTranslations("auth");
  const brand = getBrand();

  // Resolve the login bg: SiteSettings override → env fallback → null.
  let loginBgUrl: string | null = null;
  let siteName = brand.name;
  let logoUrl: string | null = brand.logoUrl ?? null;
  try {
    const settings = await db.siteSettings.findUnique({
      where: { id: "singleton" },
      select: { loginBgUrl: true, siteName: true, logoUrl: true },
    });
    if (settings?.loginBgUrl) loginBgUrl = settings.loginBgUrl;
    if (settings?.siteName) siteName = settings.siteName;
    if (settings?.logoUrl) logoUrl = settings.logoUrl;
  } catch {
    /* DB not ready — use env defaults */
  }
  if (!loginBgUrl) loginBgUrl = process.env.LOGIN_BG_IMAGE_URL ?? null;

  return (
    <main className="grid min-h-[100dvh] lg:grid-cols-2">
      {/* Left / bg column — hero image with brand overlay */}
      <aside
        className="relative hidden lg:block"
        style={
          loginBgUrl
            ? {
                backgroundImage: `url(${loginBgUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : { background: `linear-gradient(135deg, ${brand.primaryColor} 0%, #1e293b 100%)` }
        }
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-black/30 to-transparent" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <Link href="/" className="flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={siteName} className="h-8 w-auto" />
            ) : null}
            <span className="text-lg font-semibold tracking-tight">{siteName}</span>
          </Link>
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold leading-tight">
              Welcome back.
            </h2>
            <p className="text-sm text-white/80">
              Sign in to manage programs, campaigns, and community impact.
            </p>
          </div>
        </div>
      </aside>

      {/* Right column — form */}
      <section className="flex min-h-[100dvh] items-center justify-center bg-[--color-bg] p-6 lg:p-10">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile-only brand header (left column is hidden on small screens) */}
          <div className="lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={siteName} className="h-7 w-auto" />
              ) : null}
              <span className="text-base font-semibold tracking-tight">{siteName}</span>
            </Link>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("signInTitle")}
            </h1>
            <p className="text-sm text-[--color-muted-fg]">
              Use your email and password below.
            </p>
          </div>

          <LoginForm next={sp.next} error={sp.error} />

          <div className="text-center text-xs text-[--color-muted-fg]">
            <Link href="/" className="hover:underline">
              ← Back to {siteName}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
