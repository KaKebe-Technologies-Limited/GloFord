"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { Globe } from "lucide-react";
import { locales, LOCALE_LABELS, type Locale } from "@/lib/i18n/config";
import { setLocaleAction } from "@/lib/actions/locale";

export function LocaleSwitcher() {
  const current = useLocale() as Locale;
  const [pending, start] = useTransition();
  return (
    <label className="inline-flex items-center gap-1.5 text-sm text-[--color-muted-fg]">
      <Globe className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">Language</span>
      <select
        aria-label="Language"
        value={current}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          start(() => setLocaleAction(next));
        }}
        className="rounded-[--radius-sm] border border-[--color-border] bg-transparent px-1 py-0.5 text-sm"
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {LOCALE_LABELS[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
