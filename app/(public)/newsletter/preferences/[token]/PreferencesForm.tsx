"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { updatePreferencesAction } from "@/lib/actions/subscriberPreferences";
import type { SubscriberPreferences } from "@/lib/services/subscribers/preferences";
import Link from "next/link";

export function PreferencesForm({
  token,
  initial,
}: {
  token: string;
  initial: SubscriberPreferences;
}) {
  const t = useTranslations("public.newsletterPreferences");
  const [prefs, setPrefs] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const PREF_OPTIONS: { key: keyof SubscriberPreferences; label: string; description: string }[] = [
    {
      key: "newsletters",
      label: t("prefNewslettersLabel"),
      description: t("prefNewslettersDesc"),
    },
    {
      key: "campaigns",
      label: t("prefCampaignsLabel"),
      description: t("prefCampaignsDesc"),
    },
    {
      key: "events",
      label: t("prefEventsLabel"),
      description: t("prefEventsDesc"),
    },
  ];

  const toggle = (key: keyof SubscriberPreferences) =>
    setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const save = () => {
    start(async () => {
      try {
        const result = await updatePreferencesAction(token, prefs);
        if (result.unsubscribed) {
          setUnsubscribed(true);
        } else {
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : t("errorDefault"));
      }
    });
  };

  if (unsubscribed) {
    return (
      <div className="mt-10 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center">
        <h2 className="text-lg font-semibold">{t("unsubscribedHeading")}</h2>
        <p className="mt-2 text-sm text-[var(--color-muted-fg)]">
          {t("unsubscribedDesc")}
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-muted)]"
        >
          {t("backToHome")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] divide-y divide-[var(--color-border)]">
        {PREF_OPTIONS.map((opt) => (
          <label
            key={opt.key}
            aria-label={opt.label}
            className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-[var(--color-muted)]"
          >
            <div>
              <p className="text-sm font-medium">{opt.label}</p>
              <p className="text-xs text-[var(--color-muted-fg)]">{opt.description}</p>
            </div>
            <input
              type="checkbox"
              checked={prefs[opt.key]}
              onChange={() => toggle(opt.key)}
              className="h-5 w-5 rounded border-[var(--color-input)] text-[var(--color-primary)] focus:ring-[var(--color-ring)]"
            />
          </label>
        ))}
      </div>

      {error && (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={save}
          disabled={pending}
          className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
        >
          {pending ? t("saving") : t("saveButton")}
        </button>
        {saved && (
          <span className="text-sm text-[var(--color-success)]">{t("saved")}</span>
        )}
      </div>

      <p className="text-center text-xs text-[var(--color-muted-fg)]">
        {t("unsubscribePrompt")}{" "}
        <Link
          href={`/newsletter/unsubscribe/${token}`}
          className="text-[var(--color-primary)] hover:underline"
        >
          {t("unsubscribeLink")}
        </Link>
      </p>
    </div>
  );
}
