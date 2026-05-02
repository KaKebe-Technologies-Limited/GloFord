import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { listActiveCampaigns } from "@/lib/services/campaigns";
import { DonateWidget, type WidgetProvider } from "@/components/donate/DonateWidget";
import { getPublicDonationContext } from "@/lib/services/donations/public";
import { formatMoney } from "@/lib/utils/money";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Heart, Target, ArrowRight } from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";
const DEFAULT_OG = `${APP_URL}/seed-images/gloford/hero-community.jpg`;

export const metadata: Metadata = {
  title: "Donate",
  description: "Support community-led programs in health, education, and resilience.",
  openGraph: {
    title: "Donate",
    description: "Support community-led programs in health, education, and resilience.",
    type: "website",
    url: `${APP_URL}/donate`,
    images: [{ url: DEFAULT_OG, width: 1200, height: 630, alt: "Gloford Foundation" }],
  },
  twitter: { card: "summary_large_image", title: "Donate" },
};

export default async function DonatePage() {
  const ctx = await getPublicDonationContext();
  const { org, providers, donationsEnabled, campaignsEnabled } = ctx;

  if (!donationsEnabled) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <Heart className="mx-auto mb-4 h-12 w-12 text-[var(--color-muted-fg)]" />
          <h1 className="text-3xl font-bold text-[var(--color-fg)]">Donations Paused</h1>
          <p className="mt-3 text-[var(--color-muted-fg)]">
            Online donations are currently not available. Please check back later.
          </p>
          <Link href="/"
            className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white">
            Back to Home
          </Link>
        </div>
      </section>
    );
  }

  const campaigns = campaignsEnabled ? await listActiveCampaigns() : [];

  // Get donation totals per campaign for progress bars
  const campaignProgress = await Promise.all(
    campaigns.map(async (c) => {
      const result = await db.donation.aggregate({
        where: { campaignId: c.id, status: "SUCCEEDED" },
        _sum: { amountCents: true },
        _count: true,
      });
      return {
        ...c,
        raisedCents: result._sum.amountCents ?? 0,
        donorCount: result._count,
      };
    }),
  );

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[rgb(248_250_249)] via-white to-[rgb(240_247_244)] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <ScrollReveal>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              Make a Difference
            </p>
            <h1 className="font-display text-4xl font-bold text-[var(--color-fg)] sm:text-5xl">
              Support {org.name}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-[var(--color-muted-fg)]">
              Your gift funds community-led programs in health, education, and
              resilience. Every contribution creates lasting change.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Main content */}
      <section className="bg-[var(--color-bg)] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_420px]">
            {/* Left: campaigns + general */}
            <div className="space-y-10">
              {/* Active campaigns */}
              {campaignsEnabled && campaignProgress.length > 0 && (
                <div>
                  <ScrollReveal>
                    <h2 className="font-display text-2xl font-bold text-[var(--color-fg)]">Active Campaigns</h2>
                    <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
                      Choose a campaign to support, or make a general donation.
                    </p>
                  </ScrollReveal>
                  <div className="mt-6 space-y-4">
                    {campaignProgress.map((c, i) => {
                      const percentage = c.goalCents
                        ? Math.min(100, Math.round((c.raisedCents / c.goalCents) * 100))
                        : null;
                      return (
                        <ScrollReveal key={c.id} delay={i * 0.05}>
                          <Link
                            href={`/donate/${c.slug}`}
                            className="group block rounded-2xl border border-[var(--color-border)] bg-white p-6 transition hover:shadow-xl hover:border-[rgb(var(--token-primary)/0.30)]"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-[var(--color-fg)] group-hover:text-[var(--color-primary)]">
                                  {c.title}
                                </h3>
                                <p className="mt-1 line-clamp-2 text-sm text-[var(--color-muted-fg)]">
                                  {c.description}
                                </p>
                              </div>
                              <div className="flex-shrink-0">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgb(var(--token-primary)/0.10)]">
                                  <Target className="h-5 w-5 text-[var(--color-primary)]" />
                                </div>
                              </div>
                            </div>

                            {/* Progress bar */}
                            {c.goalCents && (
                              <div className="mt-4">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-semibold text-[var(--color-primary)]">
                                    {formatMoney(c.raisedCents, c.currency)} raised
                                  </span>
                                  <span className="text-[var(--color-muted-fg)]">
                                    Goal: {formatMoney(c.goalCents, c.currency)}
                                  </span>
                                </div>
                                <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-[var(--color-muted)]">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <div className="mt-1.5 flex items-center justify-between text-xs text-[var(--color-muted-fg)]">
                                  <span>{percentage}% funded</span>
                                  <span>{c.donorCount} donor{c.donorCount !== 1 ? "s" : ""}</span>
                                </div>
                              </div>
                            )}

                            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)]">
                              Donate to this campaign <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                            </span>
                          </Link>
                        </ScrollReveal>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* General donation info */}
              <ScrollReveal>
                <div className="rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[rgb(240_247_244)] to-[rgb(230_242_236)] p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--token-primary)/0.10)]">
                      <Heart className="h-6 w-6 text-[var(--color-primary)]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--color-fg)]">General Donation</h3>
                      <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
                        Not sure which campaign to support? Make a general donation and
                        we&apos;ll direct your gift to where it&apos;s needed most.
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Right: Donation widget */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <ScrollReveal delay={0.2}>
                <DonateWidget providers={providers as WidgetProvider[]} />
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
