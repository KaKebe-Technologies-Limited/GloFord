import { notFound } from "next/navigation";
import { requireActorFromSession } from "@/lib/auth-context";
import { getCampaignForEdit } from "@/lib/services/campaigns";
import { CampaignForm } from "../CampaignForm";

export default async function EditCampaign({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireActorFromSession();
  const campaign = await getCampaignForEdit(id);
  if (!campaign) notFound();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{campaign.title}</h1>
        <p className="text-sm text-[--color-muted-fg]">/donate/{campaign.slug}</p>
      </header>
      <CampaignForm
        initial={{
          id: campaign.id,
          slug: campaign.slug,
          title: campaign.title,
          description: campaign.description,
          goalCents: campaign.goalCents ?? undefined,
          currency: campaign.currency,
          startsAt: campaign.startsAt ? toInput(campaign.startsAt) : "",
          endsAt: campaign.endsAt ? toInput(campaign.endsAt) : "",
          programId: campaign.programId ?? "",
          isActive: campaign.isActive,
        }}
      />
    </div>
  );
}

function toInput(d: Date): string {
  // datetime-local input expects "YYYY-MM-DDTHH:mm"
  return d.toISOString().slice(0, 16);
}
