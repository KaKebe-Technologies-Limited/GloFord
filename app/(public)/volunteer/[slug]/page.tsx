import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Clock, Building2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { getVolunteerBySlug } from "@/lib/services/volunteer";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

type Props = { params: Promise<{ slug: string }> };

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const opp = await getVolunteerBySlug(slug);
    const description = opp.description.slice(0, 160);
    return {
      title: opp.title,
      description,
      openGraph: {
        title: opp.title,
        description,
        type: "article",
        url: `${APP_URL}/volunteer/${slug}`,
        images: [{ url: "/logo.png", width: 512, height: 512, alt: "Gloford" }],
      },
      twitter: { card: "summary_large_image" },
    };
  } catch {
    return { title: "Volunteer Opportunity" };
  }
}

export default async function VolunteerDetailPage({ params }: Props) {
  const { slug } = await params;
  let opp;
  try {
    opp = await getVolunteerBySlug(slug);
  } catch {
    notFound();
  }

  const requirements = (opp.requirements as string[]) ?? [];
  const benefits = (opp.benefits as string[]) ?? [];

  return (
    <>
      {/* Hero */}
      <section className="w-full bg-gradient-to-br from-[rgb(248_250_249)] to-[rgb(240_247_244)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <ScrollReveal>
            <Link
              href="/volunteer"
              className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Opportunities
            </Link>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-[var(--color-fg)] sm:text-4xl lg:text-5xl">
              {opp.title}
            </h1>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-[var(--color-muted-fg)]">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-4 w-4" /> {opp.department}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {opp.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {opp.commitment}
              </span>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Content */}
      <section className="w-full bg-[var(--color-bg)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Main column */}
            <div className="space-y-10 lg:col-span-2">
              <ScrollReveal>
                <h2 className="font-display text-xl font-bold text-[var(--color-fg)]">
                  About This Opportunity
                </h2>
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[var(--color-muted-fg)]">
                  {opp.description}
                </p>
              </ScrollReveal>

              {requirements.length > 0 && (
                <ScrollReveal>
                  <h2 className="font-display text-xl font-bold text-[var(--color-fg)]">
                    Requirements
                  </h2>
                  <ul className="mt-4 space-y-2">
                    {requirements.map((req, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-[var(--color-muted-fg)]"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </ScrollReveal>
              )}

              {benefits.length > 0 && (
                <ScrollReveal>
                  <h2 className="font-display text-xl font-bold text-[var(--color-fg)]">
                    Benefits
                  </h2>
                  <ul className="mt-4 space-y-2">
                    {benefits.map((b, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-[var(--color-muted-fg)]"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </ScrollReveal>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <ScrollReveal>
                <div className="sticky top-24 rounded-2xl border border-[var(--color-border)] bg-white p-6">
                  <h3 className="font-display text-lg font-bold text-[var(--color-fg)]">
                    Interested?
                  </h3>
                  <p className="mt-2 text-sm text-[var(--color-muted-fg)]">
                    Apply now and join our team of dedicated volunteers making a
                    real difference.
                  </p>
                  <Link
                    href={`/volunteer/${opp.slug}/apply`}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-[rgb(var(--token-primary)/0.90)]"
                  >
                    Apply Now
                  </Link>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
