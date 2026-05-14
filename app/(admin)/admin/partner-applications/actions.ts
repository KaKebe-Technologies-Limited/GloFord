"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import { updatePartnerApplicationStatus } from "@/lib/services/partnerApplications";
import { parseFormData, updatePartnerAppStatusSchema } from "@/lib/validators/admin";

export async function updatePartnerApplicationStatusAction(formData: FormData) {
  const actor = await requireActorFromSession();
  const { id, status } = parseFormData(updatePartnerAppStatusSchema, formData);
  await updatePartnerApplicationStatus(id, status, actor.userId);
  revalidatePath("/admin/partner-applications");
}
