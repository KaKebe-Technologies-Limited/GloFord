import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Briefcase, MapPin, Clock, ArrowRight, GraduationCap } from "lucide-react";
import Image from "next/image";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";
const DEFAULT_OG = `${APP_URL}/seed-images/gloford/hero-community.jpg`;

export const metadata: Metadata = {
  title: "Internships",
  description: "Gain real-world experience in community development. Explore our internship opportunities.",
  openGraph: {
    title: "Internships",
    description: "Gain real-world experience in community development. Explore our internship opportunities.",
    type: "website",
    url: `${APP_URL}/internships`,
    images: [{ url: DEFAULT_OG, width: 1200, height: 630, alt: "Gloford Foundation" }],
  },
  twitter: { card: "summary_large_image", title: "Internships" },
};

export default async function InternshipsPage() {
  const internships = await db.career.findMany({
    where: { isActive: true, type: "INTERNSHIP" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[rgb(248_250_249)] via-white to-[rgb(240_247_244)] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <ScrollReveal>
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
                Start Your Journey
              </p>
              <h1 className="font-display text-4xl font-bold text-[var(--color-fg)] sm:text-5xl">
                Internship Program
              </h1>
              <p className="mt-4 text-lg text-[var(--color-muted-fg)]">
                Our internships are designed for emerging professionals who want real
                exposure to community development work. Interns work alongside experienced
                staff on real projects — not make-work assignments.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                {internships.length > 0 && (
                  <a href="#openings"
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white transition hover:shadow-lg">
                    View Openings <ArrowRight className="h-4 w-4" />
                  </a>
                )}
                <Link href="/careers"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white">
                  All Careers
                </Link>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl">
                <Image src="/seed-images/gloford/hero-intern.jpg" alt="Interns at work" fill className="object-cover" sizes="50vw" />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Tracks */}
      <section className="bg-[var(--color-bg)] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mb-12 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">Available Tracks</p>
              <h2 className="font-display text-3xl font-bold text-[var(--color-fg)]">Find Your Path</h2>
            </div>
          </ScrollReveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Programs & Field Operations", desc: "Work directly with one of our four programs in a field setting. Ideal for public health, agriculture, social work, or development studies." },
              { title: "Communications & Media", desc: "Support our radio station, digital content, photography, and storytelling. Great for journalism, media, and communications students." },
              { title: "Research & M&E", desc: "Assist with data collection, analysis, and report writing. Suited for statistics, social sciences, or public policy." },
              { title: "Operations & Finance", desc: "Support headquarters functions including procurement, HR, and financial reporting." },
            ].map((track, i) => (
              <ScrollReveal key={track.title} delay={i * 0.1}>
                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 transition hover:shadow-lg hover:border-[rgb(var(--token-primary)/0.30)]">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[rgb(var(--token-primary)/0.10)]">
                    <GraduationCap className="h-5 w-5 text-[var(--color-primary)]" />
                  </div>
                  <h3 className="font-bold text-[var(--color-fg)]">{track.title}</h3>
                  <p className="mt-2 text-sm text-[var(--color-muted-fg)]">{track.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Open internships */}
      <section id="openings" className="bg-[rgb(248_250_249)] py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <h2 className="font-display text-2xl font-bold text-[var(--color-fg)]">Current Openings</h2>
          </ScrollReveal>
          {internships.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-white p-12 text-center">
              <GraduationCap className="mx-auto h-12 w-12 text-[rgb(var(--token-muted-fg)/0.30)]" />
              <h3 className="mt-4 text-lg font-bold text-[var(--color-fg)]">No openings right now</h3>
              <p className="mt-2 text-sm text-[var(--color-muted-fg)]">
                We accept applications on a rolling basis. Send your CV and motivation letter to internships@gloford.org
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {internships.map((job, i) => (
                <ScrollReveal key={job.id} delay={i * 0.05}>
                  <Link href={`/careers/${job.slug}`}
                    className="group block rounded-2xl border border-[var(--color-border)] bg-white p-6 transition hover:shadow-xl hover:border-[rgb(var(--token-primary)/0.30)]">
                    <h3 className="text-lg font-bold text-[var(--color-fg)] group-hover:text-[var(--color-primary)]">{job.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-[var(--color-muted-fg)]">
                      <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {job.department}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>
                      <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Internship</span>
                    </div>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)]">
                      Apply Now <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[rgb(240_247_244)] to-[rgb(230_242_236)] py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <ScrollReveal>
            <h2 className="font-display text-3xl font-bold text-[var(--color-fg)]">Ready to Apply?</h2>
            <p className="mt-4 text-[var(--color-muted-fg)]">
              Internships typically last 3-6 months and begin with a two-week orientation.
              A small stipend and transport allowance are provided.
            </p>
            <Link href="/contact"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white transition hover:shadow-lg">
              Contact Us <ArrowRight className="h-4 w-4" />
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
