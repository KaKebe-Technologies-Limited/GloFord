"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { submitPartnerAction } from "./actions";

const inputCls =
  "w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm transition focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--token-primary)/0.20)]";
const selectCls =
  "w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm transition focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--token-primary)/0.20)] appearance-none";
const labelCls = "block text-sm font-medium mb-1.5";

export function PartnerApplicationForm() {
  const t = useTranslations("public.partners");
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PARTNERSHIP_TYPES = [
    { value: "Strategic", label: t("typeStrategic") },
    { value: "Funding", label: t("typeFunding") },
    { value: "Technical", label: t("typeTechnical") },
    { value: "Implementation", label: t("typeImplementation") },
  ];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await submitPartnerAction(fd);
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit application. Please try again.");
      }
    });
  }

  if (success) {
    return (
      <ScrollReveal>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgb(var(--token-success)/0.10)]">
            <CheckCircle2 className="h-8 w-8 text-[var(--color-success)]" />
          </div>
          <h3 className="mt-6 text-xl font-semibold">{t("successHeading")}</h3>
          <p className="mt-2 text-[var(--color-muted-fg)]">
            {t("successDesc")}
          </p>
        </div>
      </ScrollReveal>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 sm:p-8"
    >
      {error && (
        <p role="alert" className="mb-5 rounded-lg bg-[rgb(var(--token-danger)/0.10)] px-4 py-3 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="organizationName" className={labelCls}>
            {t("formOrgName")}
          </label>
          <input
            id="organizationName"
            name="organizationName"
            required
            className={inputCls}
            placeholder={t("formOrgNamePlaceholder")}
          />
        </div>
        <div>
          <label htmlFor="contactName" className={labelCls}>
            {t("formContactName")}
          </label>
          <input
            id="contactName"
            name="contactName"
            required
            className={inputCls}
            placeholder={t("formContactNamePlaceholder")}
          />
        </div>
        <div>
          <label htmlFor="partEmail" className={labelCls}>
            {t("formEmail")}
          </label>
          <input
            id="partEmail"
            name="email"
            type="email"
            required
            className={inputCls}
            placeholder={t("formEmailPlaceholder")}
          />
        </div>
        <div>
          <label htmlFor="partPhone" className={labelCls}>
            {t("formPhone")}
          </label>
          <input
            id="partPhone"
            name="phone"
            type="tel"
            className={inputCls}
            placeholder={t("formPhonePlaceholder")}
          />
        </div>
        <div>
          <label htmlFor="partWebsite" className={labelCls}>
            {t("formWebsite")}
          </label>
          <input
            id="partWebsite"
            name="website"
            type="url"
            className={inputCls}
            placeholder={t("formWebsitePlaceholder")}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="partnershipType" className={labelCls}>
            {t("formPartnershipType")}
          </label>
          <div className="relative">
            <select
              id="partnershipType"
              name="partnershipType"
              required
              className={selectCls}
            >
              <option value="">{t("formSelectType")}</option>
              {PARTNERSHIP_TYPES.map((pt) => (
                <option key={pt.value} value={pt.value}>
                  {pt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-fg)]" />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="partDescription" className={labelCls}>
            {t("formAboutOrg")}
          </label>
          <textarea
            id="partDescription"
            name="description"
            required
            rows={4}
            className={inputCls}
            placeholder={t("formAboutOrgPlaceholder")}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="partMessage" className={labelCls}>
            {t("formMessage")}
          </label>
          <textarea
            id="partMessage"
            name="message"
            rows={3}
            className={inputCls}
            placeholder={t("formMessagePlaceholder")}
          />
        </div>
      </div>
      <div className="mt-8 text-center">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white transition hover:shadow-lg disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("formSubmitting")}
            </>
          ) : (
            t("formSubmit")
          )}
        </button>
      </div>
    </form>
  );
}
