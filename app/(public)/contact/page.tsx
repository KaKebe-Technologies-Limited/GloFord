import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { getBrand } from "@/config/brand";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { ContactForm } from "./ContactForm";
import { JsonLd } from "@/components/seo/JsonLd";
import { contactPageJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";
const STAFF_OG = `${APP_URL}/seed-images/gloford/hero-staff.jpg`;

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with us. We'd love to hear from you.",
  openGraph: {
    title: "Contact Us",
    description: "Get in touch with us. We'd love to hear from you.",
    type: "website",
    url: `${APP_URL}/contact`,
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Gloford" }],
  },
  twitter: { card: "summary_large_image", title: "Contact Us" },
};

export default async function ContactPage() {
  const t = await getTranslations("public.contact");

  const settings = await db.siteSettings
    .findUnique({
      where: { id: "singleton" },
      select: { siteName: true, contact: true },
    })
    .catch(() => null);

  const brand = getBrand();
  const contact = (settings?.contact as Record<string, string> | null) ?? {};

  return (
    <>
      <JsonLd
        data={[
          contactPageJsonLd({
            email: contact.email ?? brand.supportEmail,
            phone: contact.phone,
            address: contact.address,
          }),
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Contact", href: "/contact" },
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
            <p className="mx-auto mt-4 max-w-xl text-[var(--color-muted-fg)]">
              {t("subheading")}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Contact Cards + Form */}
      <section className="bg-[var(--color-bg)] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-5">
            {/* Info cards */}
            <div className="space-y-6 lg:col-span-2">
              <ScrollReveal>
                <h2 className="font-display text-2xl font-bold text-[var(--color-fg)]">
                  {t("getInTouch")}
                </h2>
                <p className="mt-2 text-sm text-[var(--color-muted-fg)]">
                  {t("responseTime")}
                </p>
              </ScrollReveal>

              <ScrollReveal delay={0.1}>
                <div className="space-y-3">
                  {[
                    {
                      icon: Mail,
                      label: t("labelEmail"),
                      value: contact.email ?? brand.supportEmail ?? "info@gloford.org",
                      href: `mailto:${contact.email ?? brand.supportEmail ?? "info@gloford.org"}`,
                    },
                    {
                      icon: Phone,
                      label: t("labelPhone"),
                      value: contact.phone ?? "+256 700 000000",
                      href: `tel:${contact.phone ?? "+256700000000"}`,
                    },
                    {
                      icon: MapPin,
                      label: t("labelAddress"),
                      value: contact.address ?? "Kampala, Uganda",
                      href: null,
                    },
                    {
                      icon: Clock,
                      label: t("labelOfficeHours"),
                      value: t("officeHoursValue"),
                      href: null,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-start gap-4 rounded-xl border border-[var(--color-border)] bg-white p-4 transition hover:shadow-sm"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--token-primary)/0.10)]">
                        <item.icon className="h-5 w-5 text-[var(--color-primary)]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-fg)]">{item.label}</p>
                        {item.href ? (
                          <a
                            href={item.href}
                            className="text-sm text-[var(--color-primary)] hover:underline"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <p className="text-sm text-[var(--color-muted-fg)]">{item.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-3">
              <ScrollReveal delay={0.2}>
                <ContactForm />
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
