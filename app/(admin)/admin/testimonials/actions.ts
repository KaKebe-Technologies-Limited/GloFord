"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import {
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "@/lib/services/testimonials";

export async function createTestimonialAction(formData: FormData) {
  await requireActorFromSession();
  await createTestimonial({
    quote: formData.get("quote") as string,
    authorName: formData.get("authorName") as string,
    authorRole: (formData.get("authorRole") as string) || undefined,
    authorOrg: (formData.get("authorOrg") as string) || undefined,
    avatarUrl: (formData.get("avatarUrl") as string) || undefined,
    rating: formData.get("rating") ? Number(formData.get("rating")) : undefined,
    order: Number(formData.get("order") || 0),
  });
  revalidatePath("/admin/testimonials");
}

export async function updateTestimonialAction(formData: FormData) {
  await requireActorFromSession();
  const id = formData.get("id") as string;
  await updateTestimonial(id, {
    quote: formData.get("quote") as string,
    authorName: formData.get("authorName") as string,
    authorRole: (formData.get("authorRole") as string) || null,
    authorOrg: (formData.get("authorOrg") as string) || null,
    avatarUrl: (formData.get("avatarUrl") as string) || null,
    rating: formData.get("rating") ? Number(formData.get("rating")) : null,
    order: Number(formData.get("order") || 0),
    isActive: formData.get("isActive") === "on",
  });
  revalidatePath("/admin/testimonials");
}

export async function deleteTestimonialAction(formData: FormData) {
  await requireActorFromSession();
  await deleteTestimonial(formData.get("id") as string);
  revalidatePath("/admin/testimonials");
}

export async function toggleTestimonialAction(formData: FormData) {
  await requireActorFromSession();
  const id = formData.get("id") as string;
  const isActive = formData.get("isActive") === "true";
  await updateTestimonial(id, { isActive: !isActive });
  revalidatePath("/admin/testimonials");
}
