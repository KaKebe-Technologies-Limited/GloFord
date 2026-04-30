"use client";

import { useState, useTransition } from "react";
import { signInAction } from "./actions";
import { useTranslations } from "next-intl";

export function LoginForm({ next, error }: { next?: string; error?: string }) {
  const t = useTranslations("auth");
  const [pending, startTransition] = useTransition();
  const [forgotShown, setForgotShown] = useState(false);

  return (
    <form
      action={(fd) => startTransition(() => signInAction(fd))}
      className="space-y-5"
      aria-busy={pending}
    >
      <input type="hidden" name="next" value={next ?? "/admin/dashboard"} />

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-[var(--color-fg)]">{t("email")}</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm text-[var(--color-fg)] transition focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--token-primary)/0.20)]"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-[var(--color-fg)]">{t("password")}</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          placeholder={t("passwordPlaceholder")}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm text-[var(--color-fg)] transition focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--token-primary)/0.20)]"
        />
      </label>

      <div className="flex items-center justify-end text-sm">
        <button
          type="button"
          className="font-medium text-[var(--color-primary)] hover:underline"
          onClick={() => setForgotShown(true)}
        >
          {t("forgotPassword")}
        </button>
      </div>

      {forgotShown && (
        <p className="rounded-lg bg-[rgb(var(--token-primary)/0.10)] px-3 py-2 text-sm text-[var(--color-primary)]">
          Please contact your administrator to reset your password.
        </p>
      )}

      {error ? (
        <p role="alert" className="rounded-lg bg-[rgb(var(--token-danger)/0.10)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {t("invalidCredentials")}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
        {pending ? t("signingIn") : t("signInTitle")}
      </button>
    </form>
  );
}
