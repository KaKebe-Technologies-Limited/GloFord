"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import {
  createFaq,
  updateFaq,
  deleteFaq,
} from "@/lib/services/faqs";

export async function createFaqAction(formData: FormData) {
  await requireActorFromSession();
  await createFaq({
    question: formData.get("question") as string,
    answer: formData.get("answer") as string,
    category: (formData.get("category") as string) || undefined,
    order: Number(formData.get("order") || 0),
  });
  revalidatePath("/admin/faqs");
}

export async function updateFaqAction(formData: FormData) {
  await requireActorFromSession();
  const id = formData.get("id") as string;
  await updateFaq(id, {
    question: formData.get("question") as string,
    answer: formData.get("answer") as string,
    category: (formData.get("category") as string) || undefined,
    order: Number(formData.get("order") || 0),
    isActive: formData.get("isActive") === "on",
  });
  revalidatePath("/admin/faqs");
}

export async function deleteFaqAction(formData: FormData) {
  await requireActorFromSession();
  await deleteFaq(formData.get("id") as string);
  revalidatePath("/admin/faqs");
}

export async function toggleFaqAction(formData: FormData) {
  await requireActorFromSession();
  const id = formData.get("id") as string;
  const isActive = formData.get("isActive") === "true";
  await updateFaq(id, { isActive: !isActive });
  revalidatePath("/admin/faqs");
}
