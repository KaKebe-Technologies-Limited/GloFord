"use client";

import { useState, useTransition } from "react";
import { updatePreferencesAction } from "@/lib/actions/subscriberPreferences";
import type { SubscriberPreferences } from "@/lib/services/subscribers/preferences";
import Link from "next/link";

const PREF_OPTIONS: { key: keyof SubscriberPreferences; label: string; description: string }[] = [
  {
    key: "newsletters",
    label: "Newsletters",
    description: "Periodic updates, stories, and news from our organization.",
  },
  {
    key: "campaigns",
    label: "Automated campaigns",
    description: "Welcome sequences, follow-ups, and milestone emails.",
  },
  {
    key: "events",
    label: "Event notifications",
    description: "Announcements and reminders for upcoming events.",
  },
];

export function PreferencesForm({
  token,
  initial,
}: {
  token: string;
  initial: SubscriberPreferences;
}) {
  const [prefs, setPrefs] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

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
        setError(e instanceof Error ? e.message : "Failed to update");
      }
    });
  };

  if (unsubscribed) {
    return (
      <div className="mt-10 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center">
        <h2 className="text-lg font-semibold">You&apos;ve been unsubscribed</h2>
        <p className="mt-2 text-sm text-[var(--color-muted-fg)]">
          All email preferences have been turned off. You won&apos;t receive further emails from us.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-muted)]"
        >
          Back to home
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
          {pending ? "Saving\u2026" : "Save preferences"}
        </button>
        {saved && (
          <span className="text-sm text-[var(--color-success)]">Preferences saved!</span>
        )}
      </div>

      <p className="text-center text-xs text-[var(--color-muted-fg)]">
        Want to unsubscribe completely?{" "}
        <Link
          href={`/newsletter/unsubscribe/${token}`}
          className="text-[var(--color-primary)] hover:underline"
        >
          Unsubscribe from all emails
        </Link>
      </p>
    </div>
  );
}
