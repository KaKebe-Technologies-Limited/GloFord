"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import { upsertSiteImage, deleteSiteImage } from "@/lib/services/siteImages";
import {
  parseFormData,
  upsertSiteImageSchema,
  deleteSchema,
} from "@/lib/validators/admin";

export async function upsertSiteImageAction(formData: FormData) {
  await requireActorFromSession();
  const data = parseFormData(upsertSiteImageSchema, formData);
  await upsertSiteImage(data);
  revalidatePath("/admin/site-images");
}

export async function deleteSiteImageAction(formData: FormData) {
  await requireActorFromSession();
  const { id } = parseFormData(deleteSchema, formData);
  await deleteSiteImage(id);
  revalidatePath("/admin/site-images");
}
