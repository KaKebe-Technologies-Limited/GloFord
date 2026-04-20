import { requireActorFromSession } from "@/lib/auth-context";
import { CampaignForm } from "../CampaignForm";

export const metadata = { title: "New campaign" };

export default async function NewCampaign() {
  await requireActorFromSession();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New campaign</h1>
      </header>
      <CampaignForm />
    </div>
  );
}
