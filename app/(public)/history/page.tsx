import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { AnimatedCounter } from "@/components/motion/AnimatedCounter";
import { getActiveSiteStats } from "@/lib/services/siteStats";
import { ArrowRight, Calendar } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";

export const metadata: Metadata = {
  title: "Our History",
  description: "The story of our growth from a small community initiative to a regional force for change.",
  openGraph: {
    title: "Our History",
    description: "The story of our growth from a small community initiative to a regional force for change.",
    type: "website",
    url: `${APP_URL}/history`,
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Gloford" }],
  },
  twitter: { card: "summary_large_image", title: "Our History" },
};

const IMAGES = [
  "/seed-images/gloford/hero-community.jpg",
  "/seed-images/gloford/hero-field.jpg",
  "/seed-images/gloford/hero-radio.jpg",
  "/seed-images/gloford/hero-climate.jpg",
  "/seed-images/gloford/hero-youth.jpg",
  "/seed-images/gloford/hero-staff.jpg",
];

const TIMELINE = [
  { year: "2009", title: "The Beginning", text: "Founded by Dr. Isaac Mukasa in Jinja district. The first program was a mobile reproductive health clinic visiting five villages on a rotating weekly schedule.", image: 0 },
  { year: "2011", title: "Youth Program Launched", text: "We launched our first youth mentorship cohort. Twelve young people completed a six-month program combining life skills, financial literacy, and vocational training.", image: 1 },
  { year: "2013", title: "Expansion to Soroti", text: "Community leaders in Soroti district invited us to replicate our health outreach model. We established our second field office and hired 15 local staff.", image: 2 },
  { year: "2015", title: "Community Radio Goes Live", text: "We launched our community radio station, broadcasting in six local languages. Listenership reached 500,000 within the first year.", image: 3 },
  { year: "2017", title: "Climate Resilience Program", text: "We distributed drought-resistant seed varieties, built rainwater harvesting systems, and established early-warning networks in 200 farming communities.", image: 4 },
  { year: "2019", title: "Ten Years, Ten Districts", text: "Our annual beneficiary count exceeded 80,000, and our team had grown to 60 staff members across ten districts.", image: 5 },
  { year: "2020", title: "COVID-19 Response", text: "Our mobile clinics adapted to include COVID-19 screening and prevention education. Our youth program pivoted to digital skills training.", image: 0 },
  { year: "2022", title: "Northern Uganda Expansion", text: "We opened our Gulu field office, marking our entry into northern Uganda through a multi-year partnership with PEPFAR.", image: 1 },
  { year: "2024", title: "14 Districts and Growing", text: "Today we operate across 14 districts with four integrated programs. Our community radio reaches over 2 million listeners weekly.", image: 5 },
];

export default async function HistoryPage() {
  const stats = await getActiveSiteStats();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Our History", href: "/history" },
        ])}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[rgb(248_250_249)] via-white to-[rgb(240_247_244)] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <ScrollReveal>
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
                Our Journey
              </p>
              <h1 className="font-display text-4xl font-bold text-[var(--color-fg)] sm:text-5xl">
                Our History
              </h1>
              <p className="mt-4 text-lg text-[var(--color-muted-fg)]">
                From a single mobile clinic in Jinja to a regional organization
                serving 14 districts — this is the story of community-driven growth.
              </p>
              <Link href="/who-we-are"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white transition hover:shadow-lg">
                About Us <ArrowRight className="h-4 w-4" />
              </Link>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-lg">
                  <Image src={IMAGES[0]!} alt="Early days" fill className="object-cover" sizes="25vw" priority />
                </div>
                <div className="mt-8 relative aspect-[3/4] overflow-hidden rounded-2xl shadow-lg">
                  <Image src={IMAGES[5]!} alt="Today" fill className="object-cover" sizes="25vw" />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Stats */}
      {stats.length > 0 && (
        <section className="border-y border-[var(--color-border)] bg-[var(--color-card)] py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat, i) => (
                <ScrollReveal key={stat.id} delay={i * 0.1}>
                  <div className="text-center">
                    <AnimatedCounter value={stat.value} className="block text-3xl font-bold text-[var(--color-primary)]" />
                    <p className="mt-1 text-sm text-[var(--color-muted-fg)]">{stat.label}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Timeline */}
      <section className="bg-[var(--color-bg)] py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mb-14 text-center">
              <h2 className="font-display text-3xl font-bold text-[var(--color-fg)]">Milestones</h2>
            </div>
          </ScrollReveal>

          <div className="space-y-12">
            {TIMELINE.map((event, i) => (
              <ScrollReveal key={event.year} delay={i * 0.05}>
                <div className={`flex flex-col gap-6 md:flex-row md:items-center md:gap-10 ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}>
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl shadow-lg md:w-2/5">
                    <Image src={IMAGES[event.image]!} alt={event.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 40vw" />
                    <div className="absolute left-4 top-4 rounded-full bg-[var(--color-primary)] px-4 py-1.5 text-sm font-bold text-white shadow-lg">
                      {event.year}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--token-primary)/0.10)]">
                        <Calendar className="h-4 w-4 text-[var(--color-primary)]" />
                      </div>
                      <span className="text-sm font-semibold text-[var(--color-primary)]">{event.year}</span>
                    </div>
                    <h3 className="text-xl font-bold text-[var(--color-fg)]">{event.title}</h3>
                    <p className="mt-2 leading-relaxed text-[var(--color-muted-fg)]">{event.text}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Looking forward */}
      <section className="bg-gradient-to-br from-[rgb(240_247_244)] to-[rgb(230_242_236)] py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <ScrollReveal>
            <h2 className="font-display text-3xl font-bold text-[var(--color-fg)]">Looking Forward</h2>
            <p className="mt-4 text-[var(--color-muted-fg)]">
              As we enter our next chapter, we remain committed to our founding principles
              while embracing innovation. Our goal: reach more communities and deepen our impact.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/programs"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white transition hover:shadow-lg">
                Our Programs
              </Link>
              <Link href="/donate"
                className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white">
                Support Us
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
