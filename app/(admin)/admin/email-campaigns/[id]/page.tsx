import { notFound } from "next/navigation";
import { requireActorFromSession } from "@/lib/auth-context";
import { getEmailCampaignForEdit } from "@/lib/services/emailCampaigns";
import { CampaignForm } from "../CampaignForm";
import { StepList } from "./StepList";

export const metadata = { title: "Edit email campaign" };

export default async function EditEmailCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireActorFromSession();
  const row = await getEmailCampaignForEdit(id);
  if (!row) notFound();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{row.name}</h1>
        <p className="text-sm text-[--color-muted-fg]">
          {row.isActive ? "Active" : "Paused"} · {row._count.enrollments} enrollment
          {row._count.enrollments === 1 ? "" : "s"}
        </p>
      </header>

      <CampaignForm
        initial={{
          id: row.id,
          name: row.name,
          description: row.description ?? undefined,
          trigger: row.trigger,
          isActive: row.isActive,
          segmentIds: row.segments.map((s) => s.id),
        }}
      />

      <StepList
        campaignId={row.id}
        steps={row.emails.map((e) => ({
          id: e.id,
          stepOrder: e.stepOrder,
          subject: e.subject,
          preheader: e.preheader ?? "",
          delayMinutes: e.delayMinutes,
        }))}
      />
    </div>
  );
}
