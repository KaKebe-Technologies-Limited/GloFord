import type { Metadata } from "next";
import Link from "next/link";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import {
  ArrowRight,
  Search,
  PenTool,
  Rocket,
  BarChart3,
  Heart,
  Users,
  Shield,
  Lightbulb,
} from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";

export const metadata: Metadata = {
  title: "Our Approach",
  description:
    "Learn about our methodology, principles, and approach to sustainable community development.",
  openGraph: {
    title: "Our Approach",
    description:
      "Learn about our methodology, principles, and approach to sustainable community development.",
    type: "website",
    url: `${APP_URL}/our-approach`,
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Gloford" }],
  },
  twitter: { card: "summary_large_image", title: "Our Approach" },
};

const steps = [
  {
    icon: Search,
    title: "Assess",
    desc: "We begin by deeply understanding community needs through participatory research, listening sessions, and data-driven analysis to identify the most impactful areas for intervention.",
    color: "from-blue-500 to-blue-600",
    step: "01",
  },
  {
    icon: PenTool,
    title: "Design",
    desc: "Working hand-in-hand with community members, we co-design programs that are culturally relevant, locally owned, and built to last beyond our direct involvement.",
    color: "from-emerald-500 to-emerald-600",
    step: "02",
  },
  {
    icon: Rocket,
    title: "Implement",
    desc: "With trained local teams and strong partnerships, we execute programs with precision, adapting in real-time to ensure maximum effectiveness and community engagement.",
    color: "from-amber-500 to-amber-600",
    step: "03",
  },
  {
    icon: BarChart3,
    title: "Evaluate",
    desc: "Rigorous monitoring and evaluation allow us to measure impact, share findings transparently, and continuously improve our approach for future programs.",
    color: "from-rose-500 to-rose-600",
    step: "04",
  },
];

const principles = [
  {
    icon: Heart,
    title: "Community First",
    desc: "Every decision starts and ends with the people we serve. We prioritize dignity, agency, and local leadership in all our work.",
  },
  {
    icon: Users,
    title: "Collaborative Partnership",
    desc: "We build lasting partnerships with local organizations, governments, and international bodies to amplify impact.",
  },
  {
    icon: Shield,
    title: "Accountability & Transparency",
    desc: "We hold ourselves to the highest standards of financial stewardship and open reporting to our donors and communities.",
  },
  {
    icon: Lightbulb,
    title: "Innovation & Adaptation",
    desc: "We embrace evidence-based innovation and remain flexible, adapting our strategies as contexts evolve.",
  },
];

const stats = [
  { value: "15+", label: "Years of Service" },
  { value: "50K+", label: "Lives Impacted" },
  { value: "120+", label: "Community Partners" },
  { value: "98%", label: "Program Completion Rate" },
];

export default function OurApproachPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Our Approach", href: "/our-approach" },
        ])}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[rgb(248_250_249)] to-[rgb(240_247_244)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
                How We Work
              </p>
              <h1 className="font-display text-4xl font-bold text-[var(--color-fg)] sm:text-5xl lg:text-6xl">
                Our Approach
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-[var(--color-muted-fg)]">
                We believe in sustainable, community-driven development. Our
                methodology is built on decades of experience and a commitment
                to measurable, lasting change.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Methodology */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mb-16 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
                Step by Step
              </p>
              <h2 className="font-display text-3xl font-bold text-[var(--color-fg)] sm:text-4xl">
                Our Methodology
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <ScrollReveal key={step.title} delay={i * 0.1}>
                <div className="group relative rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-sm transition hover:shadow-xl">
                  <span className="absolute -top-4 right-6 rounded-full bg-[rgb(var(--token-primary)/0.10)] px-3 py-1 text-sm font-bold text-[var(--color-primary)]">
                    {step.step}
                  </span>
                  <div
                    className={`mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${step.color} shadow-lg`}
                  >
                    <step.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-[var(--color-fg)]">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--color-muted-fg)]">
                    {step.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Connection line (decorative, visible on lg) */}
          <div className="relative mx-auto mt-8 hidden h-1 max-w-5xl lg:block">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-200 via-emerald-200 via-amber-200 to-rose-200 rounded-full" />
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="bg-[rgb(248_250_249)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mb-16 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
                What Guides Us
              </p>
              <h2 className="font-display text-3xl font-bold text-[var(--color-fg)] sm:text-4xl">
                Our Principles
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid gap-8 sm:grid-cols-2">
            {principles.map((p, i) => (
              <ScrollReveal key={p.title} delay={i * 0.1}>
                <div className="flex gap-5 rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-sm transition hover:shadow-xl">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--token-primary)/0.10)]">
                    <p.icon className="h-7 w-7 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--color-fg)]">
                      {p.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-fg)]">
                      {p.desc}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gradient-to-br from-[rgb(240_247_244)] via-white to-[rgb(248_250_249)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mb-14 text-center">
              <h2 className="font-display text-3xl font-bold text-[var(--color-fg)] sm:text-4xl">
                Our Impact in Numbers
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 0.1}>
                <div className="text-center">
                  <span className="block text-4xl font-bold text-[var(--color-primary)] sm:text-5xl">
                    {stat.value}
                  </span>
                  <p className="mt-2 text-sm font-medium text-[var(--color-muted-fg)]">
                    {stat.label}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold text-[var(--color-fg)] sm:text-4xl">
                Ready to Make an Impact Together?
              </h2>
              <p className="mt-4 text-lg text-[var(--color-muted-fg)]">
                Whether you want to donate, volunteer, or partner with us, there
                are many ways to join our mission.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link
                  href="/donate"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-7 py-3 text-sm font-semibold text-white transition hover:shadow-lg"
                >
                  <Heart className="h-4 w-4" /> Donate Now
                </Link>
                <Link
                  href="/volunteer"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-primary)] px-7 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white"
                >
                  Get Involved <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
