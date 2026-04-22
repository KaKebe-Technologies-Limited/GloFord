"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import { updateSiteSettings } from "@/lib/services/settings/site";

export async function updateSiteSettingsAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await updateSiteSettings(actor, raw);
  revalidatePath("/admin/settings/site");
  revalidatePath("/", "layout");
}
