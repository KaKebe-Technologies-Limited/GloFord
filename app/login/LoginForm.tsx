"use client";

import { useTransition } from "react";
import { signInAction } from "./actions";
import { useTranslations } from "next-intl";

export function LoginForm({ next, error }: { next?: string; error?: string }) {
  const t = useTranslations("auth");
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => startTransition(() => signInAction(fd))}
      className="space-y-4"
      aria-busy={pending}
    >
      <input type="hidden" name="next" value={next ?? "/admin/dashboard"} />
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">{t("email")}</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="w-full rounded-[--radius-md] border border-[--color-input] bg-[--color-bg] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-ring]"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">{t("password")}</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="w-full rounded-[--radius-md] border border-[--color-input] bg-[--color-bg] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-ring]"
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm text-[--color-danger]">
          {t("invalidCredentials")}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[--radius-md] bg-[--color-primary] px-4 py-2 text-sm font-medium text-[--color-primary-fg] transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "\u2026" : t("signInTitle")}
      </button>
      <div className="relative">
        <hr className="border-[--color-border]" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[--color-card] px-2 text-xs text-[--color-muted-fg]">
          or
        </span>
      </div>
      <form action="/api/auth/signin/google" method="POST">
        <input type="hidden" name="callbackUrl" value={next ?? "/admin/dashboard"} />
        <button
          type="submit"
          className="w-full rounded-[--radius-md] border border-[--color-border] px-4 py-2 text-sm font-medium transition hover:bg-[--color-muted]"
        >
          {t("continueWithGoogle")}
        </button>
      </form>
    </form>
  );
}
