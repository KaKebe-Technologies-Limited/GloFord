"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import { upsertTranslation, deleteTranslation } from "@/lib/services/translations";

export async function upsertTranslationAction(formData: FormData) {
  await requireActorFromSession();
  const locale = formData.get("locale") as string;
  const key = formData.get("key") as string;
  const value = formData.get("value") as string;
  await upsertTranslation(locale, key, value);
  revalidateTag(`translations-${locale}`);
  revalidatePath("/admin/translations");
}

export async function deleteTranslationAction(formData: FormData) {
  await requireActorFromSession();
  const id = formData.get("id") as string;
  const locale = formData.get("locale") as string;
  await deleteTranslation(id);
  revalidateTag(`translations-${locale}`);
  revalidatePath("/admin/translations");
}

export async function listTranslationsAction(locale: string) {
  await requireActorFromSession();
  const { listTranslations } = await import("@/lib/services/translations");
  return listTranslations(locale);
}
