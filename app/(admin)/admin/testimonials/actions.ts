"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import {
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "@/lib/services/testimonials";
import {
  parseFormData,
  createTestimonialSchema,
  updateTestimonialSchema,
  toggleSchema,
  deleteSchema,
} from "@/lib/validators/admin";

export async function createTestimonialAction(formData: FormData) {
  await requireActorFromSession();
  const data = parseFormData(createTestimonialSchema, formData);
  await createTestimonial({
    quote: data.quote,
    authorName: data.authorName,
    authorRole: data.authorRole ?? undefined,
    authorOrg: data.authorOrg ?? undefined,
    avatarUrl: data.avatarUrl ?? undefined,
    rating: data.rating,
    order: data.order,
  });
  revalidatePath("/admin/testimonials");
}

export async function updateTestimonialAction(formData: FormData) {
  await requireActorFromSession();
  const { id, ...rest } = parseFormData(updateTestimonialSchema, formData);
  await updateTestimonial(id, rest);
  revalidatePath("/admin/testimonials");
}

export async function deleteTestimonialAction(formData: FormData) {
  await requireActorFromSession();
  const { id } = parseFormData(deleteSchema, formData);
  await deleteTestimonial(id);
  revalidatePath("/admin/testimonials");
}

export async function toggleTestimonialAction(formData: FormData) {
  await requireActorFromSession();
  const { id, isActive } = parseFormData(toggleSchema, formData);
  await updateTestimonial(id, { isActive: !isActive });
  revalidatePath("/admin/testimonials");
}
