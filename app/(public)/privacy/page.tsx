import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how Gloford collects, uses, and protects your personal information.",
  openGraph: {
    title: "Privacy Policy",
    description:
      "Learn how Gloford collects, uses, and protects your personal information.",
    type: "website",
    url: `${APP_URL}/privacy`,
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Gloford" }],
  },
  twitter: { card: "summary_large_image", title: "Privacy Policy" },
};

export default async function PrivacyPage() {
  const t = await getTranslations("public.privacy");

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Privacy Policy", href: "/privacy" },
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
                {t("collectionTitle")}
              </h2>
              <p>{t("collectionText")}</p>
            </ScrollReveal>

            <ScrollReveal>
              <h2 className="text-xl font-bold text-[var(--color-fg)]">
                {t("useTitle")}
              </h2>
              <p>{t("useText")}</p>
            </ScrollReveal>

            <ScrollReveal>
              <h2 className="text-xl font-bold text-[var(--color-fg)]">
                {t("sharingTitle")}
              </h2>
              <p>{t("sharingText")}</p>
            </ScrollReveal>

            <ScrollReveal>
              <h2 className="text-xl font-bold text-[var(--color-fg)]">
                {t("cookiesTitle")}
              </h2>
              <p>{t("cookiesText")}</p>
            </ScrollReveal>

            <ScrollReveal>
              <h2 className="text-xl font-bold text-[var(--color-fg)]">
                {t("securityTitle")}
              </h2>
              <p>{t("securityText")}</p>
            </ScrollReveal>

            <ScrollReveal>
              <h2 className="text-xl font-bold text-[var(--color-fg)]">
                {t("rightsTitle")}
              </h2>
              <p>{t("rightsText")}</p>
            </ScrollReveal>

            <ScrollReveal>
              <h2 className="text-xl font-bold text-[var(--color-fg)]">
                {t("childrenTitle")}
              </h2>
              <p>{t("childrenText")}</p>
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
