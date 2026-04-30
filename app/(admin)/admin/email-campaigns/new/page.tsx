import { requireActorFromSession } from "@/lib/auth-context";
import { listSegments } from "@/lib/services/segments";
import { CampaignForm } from "../CampaignForm";

export const metadata = { title: "New email campaign" };

export default async function NewEmailCampaignPage() {
  await requireActorFromSession();
  const segments = await listSegments();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New email campaign</h1>
        <p className="text-sm text-[var(--color-muted-fg)]">
          Set up an automated sequence. You&apos;ll add email steps after creating it.
        </p>
      </header>
      <CampaignForm segments={segments.map((s) => ({ id: s.id, name: s.name }))} />
    </div>
  );
}
