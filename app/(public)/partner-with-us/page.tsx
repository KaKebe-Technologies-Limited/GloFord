import type { Metadata } from "next";
import Image from "next/image";
import { db } from "@/lib/db";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { getActiveTestimonials } from "@/lib/services/testimonials";
import { getActiveFaqs } from "@/lib/services/faqs";
import { TestimonialsSection } from "@/components/public/TestimonialsSection";
import { FaqSection } from "@/components/public/FaqSection";
import { PartnerInquiryForm } from "./PartnerInquiryForm";
import { Handshake, Building2, Globe, Heart, ArrowRight } from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";
const DEFAULT_OG = `${APP_URL}/seed-images/gloford/hero-community.jpg`;

export const metadata: Metadata = {
  title: "Partner With Us",
  description: "Collaborate with us to multiply community impact. Submit a partnership inquiry.",
  openGraph: {
    title: "Partner With Us",
    description: "Collaborate with us to multiply community impact. Submit a partnership inquiry.",
    type: "website",
    url: `${APP_URL}/partner-with-us`,
    images: [{ url: DEFAULT_OG, width: 1200, height: 630, alt: "Gloford Foundation" }],
  },
  twitter: { card: "summary_large_image", title: "Partner With Us" },
};

export default async function PartnerWithUsPage() {
  const [partners, testimonials, faqs] = await Promise.all([
    db.page.findMany({
      where: { slug: { startsWith: "partner-" }, status: "PUBLISHED" },
      orderBy: { updatedAt: "desc" },
      select: { slug: true, title: true, seoDesc: true, blocks: true },
    }).catch(() => []),
    getActiveTestimonials(),
    getActiveFaqs("partnerships"),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[rgb(248_250_249)] via-white to-[rgb(240_247_244)] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <ScrollReveal>
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
                Collaborate
              </p>
              <h1 className="font-display text-4xl font-bold text-[var(--color-fg)] sm:text-5xl">
                Partner With Us
              </h1>
              <p className="mt-4 text-lg text-[var(--color-muted-fg)]">
                We welcome partnerships with donors, NGOs, institutions, governments,
                and private sector actors who share our values. Together, we can
                multiply our impact across communities.
              </p>
              <a href="#inquiry"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white transition hover:shadow-lg">
                Submit Inquiry <ArrowRight className="h-4 w-4" />
              </a>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl">
                <Image src="/seed-images/gloford/hero-staff.jpg" alt="Partnership meeting" fill className="object-cover" sizes="50vw" />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Partnership types */}
      <section className="bg-[var(--color-bg)] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mb-12 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">How We Partner</p>
              <h2 className="font-display text-3xl font-bold text-[var(--color-fg)]">Types of Partnerships</h2>
            </div>
          </ScrollReveal>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Heart, title: "Funding", desc: "Support our programs through grants, sponsorships, or co-funding. We offer full transparency, regular reporting, and independent audits." },
              { icon: Building2, title: "Implementation", desc: "Co-deliver programs in areas of shared expertise. We bring deep community access and local knowledge." },
              { icon: Globe, title: "Technical", desc: "Share specialized knowledge in areas like agricultural technology, digital health, media production, or organizational development." },
              { icon: Handshake, title: "Strategic", desc: "Long-term strategic alliances that align institutional missions for sustained community impact." },
            ].map((type, i) => (
              <ScrollReveal key={type.title} delay={i * 0.1}>
                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 transition hover:shadow-lg hover:border-[rgb(var(--token-primary)/0.30)]">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[rgb(var(--token-primary)/0.10)]">
                    <type.icon className="h-6 w-6 text-[var(--color-primary)]" />
                  </div>
                  <h3 className="font-bold text-[var(--color-fg)]">{type.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-fg)]">{type.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Current partners */}
      {partners.length > 0 && (
        <section className="bg-[rgb(248_250_249)] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="mb-10 text-center">
                <h2 className="font-display text-3xl font-bold text-[var(--color-fg)]">Current Partners</h2>
              </div>
            </ScrollReveal>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {partners.map((p, i) => (
                <ScrollReveal key={p.slug} delay={i * 0.1}>
                  <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 transition hover:shadow-lg">
                    <h3 className="font-bold text-[var(--color-fg)]">{p.title}</h3>
                    {p.seoDesc && <p className="mt-2 text-sm text-[var(--color-muted-fg)]">{p.seoDesc}</p>}
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Partnership inquiry form */}
      <section id="inquiry" className="bg-[var(--color-bg)] py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mb-10 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">Get Started</p>
              <h2 className="font-display text-3xl font-bold text-[var(--color-fg)]">Partnership Inquiry</h2>
              <p className="mt-3 text-[var(--color-muted-fg)]">
                Tell us about your organization and how you&apos;d like to collaborate.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <PartnerInquiryForm />
          </ScrollReveal>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && <TestimonialsSection testimonials={testimonials} heading="Partner Testimonials" />}

      {/* FAQs */}
      {faqs.length > 0 && <FaqSection faqs={faqs} heading="Partnership FAQs" />}
    </>
  );
}
