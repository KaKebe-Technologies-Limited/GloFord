import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireActorFromSession } from "@/lib/auth-context";
import { getCampaignEmailForEdit } from "@/lib/services/emailCampaigns";
import { StepEditor } from "./StepEditor";
import type { Block } from "@/lib/blocks/types";

export const metadata = { title: "Edit email step" };

export default async function EditCampaignEmailStepPage({
  params,
}: {
  params: Promise<{ id: string; stepId: string }>;
}) {
  const { id, stepId } = await params;
  await requireActorFromSession();
  const row = await getCampaignEmailForEdit(stepId);
  if (!row || row.campaign.id !== id) notFound();

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/email-campaigns/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-[--color-muted-fg] hover:text-[--color-fg]"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back to {row.campaign.name}
      </Link>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Step {row.stepOrder + 1}: {row.subject}
        </h1>
        <p className="text-sm text-[--color-muted-fg]">
          {row.delayMinutes === 0
            ? "Sends immediately after enrollment (or after the previous step)."
            : `Sends ${row.delayMinutes} minute${row.delayMinutes === 1 ? "" : "s"} after the previous step.`}
        </p>
      </header>

      <StepEditor
        initial={{
          id: row.id,
          stepOrder: row.stepOrder,
          subject: row.subject,
          preheader: row.preheader ?? "",
          delayMinutes: row.delayMinutes,
          content: (row.content as Block[]) ?? [],
        }}
      />
    </div>
  );
}
