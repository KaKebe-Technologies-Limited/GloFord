import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSubscriberByToken, parsePreferences } from "@/lib/services/subscribers/preferences";
import { PreferencesForm } from "./PreferencesForm";

export const metadata = { title: "Email Preferences" };

export default async function PreferencesPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const t = await getTranslations("public.newsletterPreferences");
  const { token } = await params;
  const sub = await getSubscriberByToken(token);
  if (!sub || sub.status === "UNSUBSCRIBED") notFound();

  const prefs = parsePreferences(sub.preferences);

  return (
    <main className="mx-auto max-w-lg px-4 py-24">
      <h1 className="text-2xl font-semibold tracking-tight text-center">
        {t("heading")}
      </h1>
      <p className="mt-2 text-center text-sm text-[var(--color-muted-fg)]">
        {t("subheading", { recipient: sub.name || sub.email })}
      </p>
      <PreferencesForm token={token} initial={prefs} />
    </main>
  );
}
