import { notFound } from "next/navigation";
import { getSubscriberByToken, parsePreferences } from "@/lib/services/subscribers/preferences";
import { PreferencesForm } from "./PreferencesForm";

export const metadata = { title: "Email Preferences" };

export default async function PreferencesPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const sub = await getSubscriberByToken(token);
  if (!sub || sub.status === "UNSUBSCRIBED") notFound();

  const prefs = parsePreferences(sub.preferences);

  return (
    <main className="mx-auto max-w-lg px-4 py-24">
      <h1 className="text-2xl font-semibold tracking-tight text-center">
        Email Preferences
      </h1>
      <p className="mt-2 text-center text-sm text-[var(--color-muted-fg)]">
        Choose which emails you&apos;d like to receive from us, {sub.name || sub.email}.
      </p>
      <PreferencesForm token={token} initial={prefs} />
    </main>
  );
}
