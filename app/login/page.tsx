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
    /* DB not ready */
  }
  if (!loginBgUrl) loginBgUrl = process.env.LOGIN_BG_IMAGE_URL ?? "/seed-images/gloford/hero-staff.jpg";

  return (
    <main className="grid min-h-[100dvh] lg:grid-cols-[1fr_1.1fr]">
      {/* Left — hero image with brand overlay */}
      <aside
        className="relative hidden lg:block"
        style={
          loginBgUrl
            ? {
                backgroundImage: `url(${loginBgUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : { background: "linear-gradient(135deg, #1a3c34 0%, #0f1f1a 100%)" }
        }
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[rgb(26_40_35/0.9)] via-[rgb(26_40_35/0.5)] to-[rgb(26_40_35/0.3)]" />
        <div className="relative flex h-full flex-col justify-end p-12">
          <div className="space-y-3">
            <h2 className="text-4xl font-bold leading-tight text-white">
              {siteName}
            </h2>
            <p className="text-sm text-white/60">
              Community-led impact &middot; {siteName}
            </p>
          </div>
        </div>
      </aside>

      {/* Right — form */}
      <section className="flex min-h-[100dvh] items-center justify-center bg-[var(--color-bg)] p-6 lg:p-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Logo + Brand */}
          <div className="flex flex-col items-center text-center">
            {logoUrl ? (
              <Link href="/">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt={siteName} className="mb-4 h-16 w-auto" />
              </Link>
            ) : (
              <Link
                href="/"
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)] text-2xl font-bold text-white"
              >
                {siteName.charAt(0)}
              </Link>
            )}
            <h1 className="text-2xl font-bold tracking-tight">{t("signInTitle")}</h1>
            <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
              {t("signInToAdmin")}
            </p>
          </div>

          <LoginForm next={sp.next} error={sp.error} />

          <div className="text-center text-xs text-[var(--color-muted-fg)]">
            <Link href="/" className="hover:text-[var(--color-primary)] hover:underline">
              {t("backTo", { name: siteName })}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
