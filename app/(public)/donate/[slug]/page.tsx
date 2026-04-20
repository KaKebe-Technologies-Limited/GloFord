import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getActiveCampaignBySlug } from "@/lib/services/campaigns";
import { DonateWidget } from "@/components/donate/DonateWidget";
import { formatMoney } from "@/lib/utils/money";

async function resolveOrg() {
  return db.organization.findFirst({
    where: { isActive: true },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
}

export default async function CampaignDonatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const org = await resolveOrg();
  if (!org) notFound();

  let campaign;
  try {
    campaign = await getActiveCampaignBySlug(org.id, slug);
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
          <p className="mt-4 whitespace-pre-wrap text-[--color-muted-fg]">{campaign.description}</p>

          {campaign.goalCents ? (
            <div className="mt-8 space-y-2">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-semibold">
                  {formatMoney(campaign.raisedCents, campaign.currency)}
                </span>
                <span className="text-[--color-muted-fg]">
                  of {formatMoney(campaign.goalCents, campaign.currency)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[--color-muted]">
                <div
                  className="h-full rounded-full bg-[--color-primary] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-[--color-muted-fg]">
                {campaign.donationCount} donation{campaign.donationCount === 1 ? "" : "s"} so far.
              </p>
            </div>
          ) : null}
        </section>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <DonateWidget
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
