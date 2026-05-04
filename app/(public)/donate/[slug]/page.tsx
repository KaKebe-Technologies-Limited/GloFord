import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getActiveCampaignBySlug } from "@/lib/services/campaigns";
import { DonateWidget, type WidgetProvider } from "@/components/donate/DonateWidget";
import { getPublicDonationContext } from "@/lib/services/donations/public";
import { formatMoney } from "@/lib/utils/money";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const campaign = await getActiveCampaignBySlug(slug);
    const title = `Donate to ${campaign.title}`;
    const description = campaign.description.slice(0, 160);
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        url: `${APP_URL}/donate/${slug}`,
        images: [{ url: "/logo.png", width: 512, height: 512, alt: "Gloford" }],
      },
      twitter: { card: "summary_large_image", title },
    };
  } catch {
    return { title: "Donate" };
  }
}

export default async function CampaignDonatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { providers, donationsEnabled, campaignsEnabled } = await getPublicDonationContext();

  if (!donationsEnabled || !campaignsEnabled) notFound();

  let campaign;
  try {
    campaign = await getActiveCampaignBySlug(slug);
  } catch {
    notFound();
  }

  const progress = campaign.goalCents
    ? Math.min(100, Math.round((campaign.raisedCents / campaign.goalCents) * 100))
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
        <section>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{campaign.title}</h1>
          <p className="mt-4 whitespace-pre-wrap text-[var(--color-muted-fg)]">{campaign.description}</p>

          {campaign.goalCents ? (
            <div className="mt-8 space-y-2">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-semibold">
                  {formatMoney(campaign.raisedCents, campaign.currency)}
                </span>
                <span className="text-[var(--color-muted-fg)]">
                  of {formatMoney(campaign.goalCents, campaign.currency)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--color-muted)]">
                <div
                  className="h-full rounded-full bg-[var(--color-primary)] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-[var(--color-muted-fg)]">
                {campaign.donationCount} donation{campaign.donationCount === 1 ? "" : "s"} so far.
              </p>
            </div>
          ) : null}
        </section>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <DonateWidget
            providers={providers as WidgetProvider[]}
            campaign={{
              slug: campaign.slug,
              title: campaign.title,
              currency: campaign.currency,
            }}
          />
        </aside>
      </div>
    </div>
  );
}
