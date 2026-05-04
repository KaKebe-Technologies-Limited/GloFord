"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { submitPartnerInquiryAction } from "./actions";

const inputCls =
  "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm transition focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--token-primary)/0.20)]";
const selectCls =
  "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm transition focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--token-primary)/0.20)] appearance-none";
const labelCls = "block text-sm font-medium text-[var(--color-fg)] mb-1.5";

export function PartnerInquiryForm() {
  const t = useTranslations("public.partnerWithUs");
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        await submitPartnerInquiryAction(fd);
        setSent(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("formError"));
      }
    });
  }

  if (sent) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgb(var(--token-success)/0.10)]">
            <CheckCircle2 className="h-8 w-8 text-[var(--color-success)]" />
          </div>
          <h3 className="mt-4 text-xl font-bold text-[var(--color-fg)]">{t("successHeading")}</h3>
          <p className="mt-2 text-sm text-[var(--color-muted-fg)]">
            {t("successDesc")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-sm">
      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-[rgb(var(--token-danger)/0.10)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="orgName" className={labelCls}>{t("formOrgName")}</label>
            <input id="orgName" name="organizationName" required className={inputCls} placeholder={t("formOrgNamePlaceholder")} />
          </div>
          <div>
            <label htmlFor="contactName" className={labelCls}>{t("formContactPerson")}</label>
            <input id="contactName" name="contactName" required className={inputCls} placeholder={t("formContactPersonPlaceholder")} />
          </div>
          <div>
            <label htmlFor="email" className={labelCls}>{t("formEmail")}</label>
            <input id="email" name="email" type="email" required className={inputCls} placeholder={t("formEmailPlaceholder")} />
          </div>
          <div>
            <label htmlFor="phone" className={labelCls}>{t("formPhone")}</label>
            <input id="phone" name="phone" type="tel" className={inputCls} placeholder={t("formPhonePlaceholder")} />
          </div>
        </div>
        <div>
          <label htmlFor="website" className={labelCls}>{t("formWebsite")}</label>
          <input id="website" name="website" type="url" className={inputCls} placeholder={t("formWebsitePlaceholder")} />
        </div>
        <div>
          <label htmlFor="partnershipType" className={labelCls}>{t("formPartnershipType")}</label>
          <select id="partnershipType" name="partnershipType" required className={selectCls}>
            <option value="">{t("formSelectType")}</option>
            <option value="Funding">{t("formTypeFunding")}</option>
            <option value="Implementation">{t("formTypeImplementation")}</option>
            <option value="Technical">{t("formTypeTechnical")}</option>
            <option value="Strategic">{t("formTypeStrategic")}</option>
            <option value="Other">{t("formTypeOther")}</option>
          </select>
        </div>
        <div>
          <label htmlFor="description" className={labelCls}>{t("formAboutOrg")}</label>
          <textarea id="description" name="description" rows={3} required className={inputCls}
            placeholder={t("formAboutOrgPlaceholder")} />
        </div>
        <div>
          <label htmlFor="message" className={labelCls}>{t("formWhyPartner")}</label>
          <textarea id="message" name="message" rows={4} required className={inputCls}
            placeholder={t("formWhyPartnerPlaceholder")} />
        </div>
        <button type="submit" disabled={isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-3.5 text-sm font-semibold text-white transition hover:shadow-lg disabled:opacity-60 sm:w-auto">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {isPending ? t("formSubmitting") : t("formSubmit")}
        </button>
      </form>
    </div>
  );
}
