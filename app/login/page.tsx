import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
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
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[--color-muted] p-4">
      <div className="w-full max-w-sm space-y-6 rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] p-6 shadow-sm">
        <div className="space-y-1 text-center">
          <Link href="/" className="text-sm text-[--color-muted-fg] hover:underline">
            &larr; Back to site
          </Link>
          <h1 className="text-xl font-semibold">{t("signInTitle")}</h1>
        </div>
        <LoginForm next={sp.next} error={sp.error} />
      </div>
    </main>
  );
}
