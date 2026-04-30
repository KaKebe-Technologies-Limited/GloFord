"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import {
  createSiteStat,
  updateSiteStat,
  deleteSiteStat,
} from "@/lib/services/siteStats";

export async function createSiteStatAction(formData: FormData) {
  await requireActorFromSession();
  await createSiteStat({
    label: formData.get("label") as string,
    value: formData.get("value") as string,
    icon: (formData.get("icon") as string) || undefined,
    order: Number(formData.get("order") || 0),
  });
  revalidatePath("/admin/site-stats");
}

export async function updateSiteStatAction(formData: FormData) {
  await requireActorFromSession();
  const id = formData.get("id") as string;
  await updateSiteStat(id, {
    label: formData.get("label") as string,
    value: formData.get("value") as string,
    icon: (formData.get("icon") as string) || null,
    order: Number(formData.get("order") || 0),
    isActive: formData.get("isActive") === "on",
  });
  revalidatePath("/admin/site-stats");
}

export async function deleteSiteStatAction(formData: FormData) {
  await requireActorFromSession();
  await deleteSiteStat(formData.get("id") as string);
  revalidatePath("/admin/site-stats");
}

export async function toggleSiteStatAction(formData: FormData) {
  await requireActorFromSession();
  const id = formData.get("id") as string;
  const isActive = formData.get("isActive") === "true";
  await updateSiteStat(id, { isActive: !isActive });
  revalidatePath("/admin/site-stats");
}
