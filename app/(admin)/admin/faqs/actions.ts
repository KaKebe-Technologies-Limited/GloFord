"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import { createFaq, updateFaq, deleteFaq } from "@/lib/services/faqs";
import {
  parseFormData,
  createFaqSchema,
  updateFaqSchema,
  toggleSchema,
  deleteSchema,
} from "@/lib/validators/admin";

export async function createFaqAction(formData: FormData) {
  await requireActorFromSession();
  const data = parseFormData(createFaqSchema, formData);
  await createFaq(data);
  revalidatePath("/admin/faqs");
}

export async function updateFaqAction(formData: FormData) {
  await requireActorFromSession();
  const { id, ...rest } = parseFormData(updateFaqSchema, formData);
  await updateFaq(id, rest);
  revalidatePath("/admin/faqs");
}

export async function deleteFaqAction(formData: FormData) {
  await requireActorFromSession();
  const { id } = parseFormData(deleteSchema, formData);
  await deleteFaq(id);
  revalidatePath("/admin/faqs");
}

export async function toggleFaqAction(formData: FormData) {
  await requireActorFromSession();
  const { id, isActive } = parseFormData(toggleSchema, formData);
  await updateFaq(id, { isActive: !isActive });
  revalidatePath("/admin/faqs");
}
