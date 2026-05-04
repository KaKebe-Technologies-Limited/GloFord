import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read the terms and conditions governing use of the Gloford website and services.",
  openGraph: {
    title: "Terms of Service",
    description:
      "Read the terms and conditions governing use of the Gloford website and services.",
    type: "website",
    url: `${APP_URL}/terms`,
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Gloford" }],
  },
  twitter: { card: "summary_large_image", title: "Terms of Service" },
};

export default async function TermsPage() {
  const t = await getTranslations("public.terms");

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Terms of Service", href: "/terms" },
          ]),
        ]}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[rgb(248_250_249)] via-white to-[rgb(240_247_244)] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <ScrollReveal>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              {t("eyebrow")}
            </p>
            <h1 className="font-display text-4xl font-bold text-[var(--color-fg)] sm:text-5xl">
              {t("heading")}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-[var(--color-muted-fg)]">
              {t("subheading")}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Content */}
      <section className="bg-[var(--color-bg)] py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-neutral max-w-none space-y-10 text-[var(--color-muted-fg)]">
            <ScrollReveal>
              <h2 className="text-xl font-bold text-[var(--color-fg)]">
                {t("acceptanceTitle")}
              </h2>
              <p>{t("acceptanceText")}</p>
            </ScrollReveal>

            <ScrollReveal>
              <h2 className="text-xl font-bold text-[var(--color-fg)]">
                {t("useTitle")}
              </h2>
              <p>{t("useText")}</p>
            </ScrollReveal>

            <ScrollReveal>
              <h2 className="text-xl font-bold text-[var(--color-fg)]">
                {t("ipTitle")}
              </h2>
              <p>{t("ipText")}</p>
            </ScrollReveal>

            <ScrollReveal>
              <h2 className="text-xl font-bold text-[var(--color-fg)]">
                {t("donationsTitle")}
              </h2>
              <p>{t("donationsText")}</p>
            </ScrollReveal>

            <ScrollReveal>
              <h2 className="text-xl font-bold text-[var(--color-fg)]">
                {t("disclaimerTitle")}
              </h2>
              <p>{t("disclaimerText")}</p>
            </ScrollReveal>

            <ScrollReveal>
              <h2 className="text-xl font-bold text-[var(--color-fg)]">
                {t("liabilityTitle")}
              </h2>
              <p>{t("liabilityText")}</p>
            </ScrollReveal>

            <ScrollReveal>
              <h2 className="text-xl font-bold text-[var(--color-fg)]">
                {t("changesTitle")}
              </h2>
              <p>{t("changesText")}</p>
            </ScrollReveal>

            <ScrollReveal>
              <h2 className="text-xl font-bold text-[var(--color-fg)]">
                {t("contactTitle")}
              </h2>
              <p>{t("contactText")}</p>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </>
  );
}
