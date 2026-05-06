"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import { upsertSiteImage, deleteSiteImage } from "@/lib/services/siteImages";

export async function upsertSiteImageAction(formData: FormData) {
  await requireActorFromSession();
  await upsertSiteImage({
    key: formData.get("key") as string,
    label: formData.get("label") as string,
    url: formData.get("url") as string,
    alt: (formData.get("alt") as string) || null,
  });
  revalidatePath("/admin/site-images");
}

export async function deleteSiteImageAction(formData: FormData) {
  await requireActorFromSession();
  const id = formData.get("id") as string;
  await deleteSiteImage(id);
  revalidatePath("/admin/site-images");
}
