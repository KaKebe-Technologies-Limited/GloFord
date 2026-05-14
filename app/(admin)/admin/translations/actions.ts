"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import { upsertTranslation, deleteTranslation } from "@/lib/services/translations";
import {
  parseFormData,
  upsertTranslationSchema,
  deleteSchema,
} from "@/lib/validators/admin";

export async function upsertTranslationAction(formData: FormData) {
  await requireActorFromSession();
  const { locale, key, value } = parseFormData(upsertTranslationSchema, formData);
  await upsertTranslation(locale, key, value);
  revalidateTag(`translations-${locale}`);
  revalidatePath("/admin/translations");
}

export async function deleteTranslationAction(formData: FormData) {
  await requireActorFromSession();
  const { id } = parseFormData(deleteSchema, formData);
  const locale = formData.get("locale") as string;
  await deleteTranslation(id);
  if (locale) revalidateTag(`translations-${locale}`);
  revalidatePath("/admin/translations");
}

export async function listTranslationsAction(locale: string) {
  await requireActorFromSession();
  const { listTranslations } = await import("@/lib/services/translations");
  return listTranslations(locale);
}
