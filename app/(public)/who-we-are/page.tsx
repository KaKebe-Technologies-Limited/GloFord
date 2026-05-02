import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { AnimatedCounter } from "@/components/motion/AnimatedCounter";
import { getActiveSiteStats } from "@/lib/services/siteStats";
import { getActiveTestimonials } from "@/lib/services/testimonials";
import { getActiveLeaderMessages } from "@/lib/services/leaderMessages";
import { TestimonialsSection } from "@/components/public/TestimonialsSection";
import { LeaderMessageSection } from "@/components/public/LeaderMessageSection";
// Seed images for varied visual sections
const IMAGES = {
  hero: "/seed-images/gloford/hero-community.jpg",
  story: "/seed-images/gloford/hero-field.jpg",
  team: "/seed-images/gloford/hero-staff.jpg",
  youth: "/seed-images/gloford/hero-youth.jpg",
  climate: "/seed-images/gloford/hero-climate.jpg",
};
import {
  ArrowRight,
  Target,
  Eye,
  Heart,
  Shield,
  Users,
  Sparkles,
} from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";
const DEFAULT_OG = `${APP_URL}/seed-images/gloford/hero-community.jpg`;

export const metadata: Metadata = {
  title: "Who We Are",
  description:
    "Learn about our story, mission, vision, and the values that drive our work across communities.",
  openGraph: {
    title: "Who We Are",
    description:
      "Learn about our story, mission, vision, and the values that drive our work across communities.",
    type: "website",
    url: `${APP_URL}/who-we-are`,
    images: [{ url: DEFAULT_OG, width: 1200, height: 630, alt: "Gloford Foundation" }],
  },
  twitter: { card: "summary_large_image", title: "Who We Are" },
};

export default async function WhoWeArePage() {
  const [stats, testimonials, messages] = await Promise.all([
    getActiveSiteStats(),
    getActiveTestimonials(),
    getActiveLeaderMessages(),
  ]);

  return (
    <>
      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-[rgb(248_250_249)] via-white to-[rgb(240_247_244)] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <ScrollReveal>
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
                About Us
              </p>
              <h1 className="font-display text-4xl font-bold text-[var(--color-fg)] sm:text-5xl">
                Who We Are
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-[var(--color-muted-fg)]">
                A community-driven foundation dedicated to empowering underserved
                communities through sustainable development, education, and healthcare.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/programs"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white transition hover:shadow-lg"
                >
                  Our Programs <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/our-history"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white"
                >
                  Our History
                </Link>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-lg">
                    <Image src={IMAGES.hero} alt="Community work" fill className="object-cover" sizes="25vw" priority />
                  </div>
                  <div className="relative aspect-square overflow-hidden rounded-2xl shadow-lg">
                    <Image src={IMAGES.climate} alt="Environmental work" fill className="object-cover" sizes="25vw" />
                  </div>
                </div>
                <div className="mt-8 space-y-4">
                  <div className="relative aspect-square overflow-hidden rounded-2xl shadow-lg">
                    <Image src={IMAGES.youth} alt="Youth programs" fill className="object-cover" sizes="25vw" />
                  </div>
                  <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-lg">
                    <Image src={IMAGES.team} alt="Our team" fill className="object-cover" sizes="25vw" />
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Our Story ── */}
      <section className="bg-[var(--color-bg)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
            <ScrollReveal>
              <div className="space-y-6">
                <p className="text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
                  Our Story
                </p>
                <h2 className="font-display text-3xl font-bold text-[var(--color-fg)] sm:text-4xl">
                  From a Vision to a Movement
                </h2>
                <div className="space-y-4 text-[var(--color-muted-fg)] leading-relaxed">
                  <p>
                    Founded with a simple yet powerful belief — that every community
                    deserves the opportunity to thrive — we began our journey in the
                    heart of East Africa. What started as a small group of passionate
                    individuals has grown into a movement touching thousands of lives.
                  </p>
                  <p>
                    Over the years, we have partnered with local communities,
                    governments, and international organizations to deliver programs
                    that create lasting change. From building schools to training
                    healthcare workers, every initiative is rooted in the belief
                    that sustainable development begins with empowered people.
                  </p>
                  <p>
                    Today, we continue to expand our reach, driven by the same
                    passion that inspired our founding — and the communities we
                    serve remain at the heart of everything we do.
                  </p>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <div className="relative">
                <div className="aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl">
                  <Image
                    src={IMAGES.story}
                    alt="Our journey"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 rounded-xl bg-[var(--color-primary)] p-5 text-white shadow-xl">
                  <p className="text-3xl font-bold">10+</p>
                  <p className="text-sm text-white/80">Years of Impact</p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Mission & Vision ── */}
      <section className="bg-gradient-to-br from-[rgb(240_247_244)] via-[rgb(220_237_230)] to-[rgb(240_247_244)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            <ScrollReveal>
              <div className="rounded-2xl border border-[rgb(26_60_52/0.1)] bg-white p-10 shadow-sm">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-[rgb(var(--token-primary)/0.10)]">
                  <Target className="h-7 w-7 text-[var(--color-primary)]" />
                </div>
                <h3 className="mb-4 font-display text-2xl font-bold text-[var(--color-fg)]">
                  Our Mission
                </h3>
                <p className="leading-relaxed text-[var(--color-muted-fg)]">
                  To empower marginalized communities through education, healthcare,
                  and sustainable development programs that foster self-reliance,
                  dignity, and long-term prosperity for all.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.15}>
              <div className="rounded-2xl border border-[rgb(26_60_52/0.1)] bg-white p-10 shadow-sm">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-[rgb(var(--token-accent)/0.10)]">
                  <Eye className="h-7 w-7 text-[var(--color-accent)]" />
                </div>
                <h3 className="mb-4 font-display text-2xl font-bold text-[var(--color-fg)]">
                  Our Vision
                </h3>
                <p className="leading-relaxed text-[var(--color-muted-fg)]">
                  A world where every community has equitable access to education,
                  healthcare, and economic opportunity — where no one is left behind
                  and every person can reach their full potential.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Core Values ── */}
      <section className="bg-[var(--color-bg)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mb-14 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
                What Drives Us
              </p>
              <h2 className="font-display text-3xl font-bold text-[var(--color-fg)] sm:text-4xl">
                Our Core Values
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Heart, title: "Compassion", desc: "We lead with empathy and genuine care for the communities we serve." },
              { icon: Shield, title: "Integrity", desc: "Transparency and accountability in every action, every decision." },
              { icon: Users, title: "Community", desc: "We believe in the power of collective action and local ownership." },
              { icon: Sparkles, title: "Innovation", desc: "Creative, sustainable solutions tailored to each community's needs." },
            ].map((v, i) => (
              <ScrollReveal key={v.title} delay={i * 0.1}>
                <div className="group rounded-2xl border border-[var(--color-border)] p-8 text-center transition hover:border-[rgb(var(--token-primary)/0.30)] hover:shadow-lg">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--token-primary)/0.10)] transition group-hover:bg-[var(--color-primary)] group-hover:text-white">
                    <v.icon className="h-6 w-6 text-[var(--color-primary)] transition group-hover:text-white" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-[var(--color-fg)]">{v.title}</h3>
                  <p className="text-sm text-[var(--color-muted-fg)]">{v.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      {stats.length > 0 && (
        <section className="border-y border-[var(--color-border)] bg-[rgb(248_250_249)] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat, i) => (
                <ScrollReveal key={stat.id} delay={i * 0.1}>
                  <div className="text-center">
                    <AnimatedCounter
                      value={stat.value}
                      className="block text-3xl font-bold text-[var(--color-primary)] sm:text-4xl"
                    />
                    <p className="mt-2 text-sm text-[var(--color-muted-fg)]">{stat.label}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Leader Messages ── */}
      {messages.length > 0 && <LeaderMessageSection messages={messages} />}

      {/* ── Testimonials ── */}
      {testimonials.length > 0 && (
        <TestimonialsSection testimonials={testimonials} />
      )}

      {/* ── CTA ── */}
      <section className="bg-[rgb(var(--token-muted)/0.30)] py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <ScrollReveal>
            <h2 className="font-display text-3xl font-bold text-[var(--color-fg)] sm:text-4xl">
              Ready to Make a Difference?
            </h2>
            <p className="mt-4 text-[var(--color-muted-fg)]">
              Join us in our mission to create lasting change. Every contribution
              matters.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/donate"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-3.5 text-sm font-semibold text-white transition hover:shadow-lg"
              >
                <Heart className="h-4 w-4" /> Donate Now
              </Link>
              <Link
                href="/get-involved"
                className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-primary)] px-8 py-3.5 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white"
              >
                Get Involved <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
