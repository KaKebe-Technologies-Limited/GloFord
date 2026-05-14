"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import {
  createSiteStat,
  updateSiteStat,
  deleteSiteStat,
} from "@/lib/services/siteStats";
import {
  parseFormData,
  createSiteStatSchema,
  updateSiteStatSchema,
  toggleSchema,
  deleteSchema,
} from "@/lib/validators/admin";

export async function createSiteStatAction(formData: FormData) {
  await requireActorFromSession();
  const data = parseFormData(createSiteStatSchema, formData);
  await createSiteStat({
    label: data.label,
    value: data.value,
    icon: data.icon ?? undefined,
    order: data.order,
  });
  revalidatePath("/admin/site-stats");
}

export async function updateSiteStatAction(formData: FormData) {
  await requireActorFromSession();
  const { id, ...rest } = parseFormData(updateSiteStatSchema, formData);
  await updateSiteStat(id, rest);
  revalidatePath("/admin/site-stats");
}

export async function deleteSiteStatAction(formData: FormData) {
  await requireActorFromSession();
  const { id } = parseFormData(deleteSchema, formData);
  await deleteSiteStat(id);
  revalidatePath("/admin/site-stats");
}

export async function toggleSiteStatAction(formData: FormData) {
  await requireActorFromSession();
  const { id, isActive } = parseFormData(toggleSchema, formData);
  await updateSiteStat(id, { isActive: !isActive });
  revalidatePath("/admin/site-stats");
}
