import { CampaignForm } from "../CampaignForm";

export const metadata = { title: "New email campaign" };

export default function NewEmailCampaignPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New email campaign</h1>
        <p className="text-sm text-[--color-muted-fg]">
          Set up an automated sequence. You&apos;ll add email steps after creating it.
        </p>
      </header>
      <CampaignForm />
    </div>
  );
}
