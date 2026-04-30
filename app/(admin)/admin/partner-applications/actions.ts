"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import { updatePartnerApplicationStatus } from "@/lib/services/partnerApplications";

export async function updatePartnerApplicationStatusAction(formData: FormData) {
  const actor = await requireActorFromSession();
  const id = formData.get("id") as string;
  const status = formData.get("status") as "PENDING" | "APPROVED" | "REJECTED";
  await updatePartnerApplicationStatus(id, status, actor.userId);
  revalidatePath("/admin/partner-applications");
}
