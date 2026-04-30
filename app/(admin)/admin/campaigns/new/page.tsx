import { requireActorFromSession } from "@/lib/auth-context";
import { listPrograms } from "@/lib/services/programs";
import { CampaignForm } from "../CampaignForm";

export const metadata = { title: "New campaign" };

export default async function NewCampaign() {
  await requireActorFromSession();
  const programs = await listPrograms();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New campaign</h1>
      </header>
      <CampaignForm programs={programs.map((p) => ({ id: p.id, title: p.title }))} />
    </div>
  );
}
