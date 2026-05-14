"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import {
  createVolunteerOpportunity,
  updateVolunteerOpportunity,
  deleteVolunteerOpportunity,
  updateVolunteerApplicationStatus,
} from "@/lib/services/volunteer";
import {
  parseFormData,
  createVolunteerSchema,
  updateVolunteerSchema,
  toggleSchema,
  deleteSchema,
  updateVolunteerAppStatusSchema,
} from "@/lib/validators/admin";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export async function createVolunteerAction(formData: FormData) {
  const actor = await requireActorFromSession();
  const data = parseFormData(createVolunteerSchema, formData);
  await createVolunteerOpportunity(actor, {
    title: data.title,
    slug: data.slug || slugify(data.title),
    department: data.department,
    location: data.location,
    commitment: data.commitment,
    description: data.description,
    requirements: data.requirements,
    benefits: data.benefits,
  });
  revalidatePath("/admin/volunteer");
}

export async function updateVolunteerAction(formData: FormData) {
  const actor = await requireActorFromSession();
  const { id, slug: rawSlug, title, ...rest } = parseFormData(updateVolunteerSchema, formData);
  await updateVolunteerOpportunity(actor, id, {
    title,
    slug: rawSlug || slugify(title),
    ...rest,
  });
  revalidatePath("/admin/volunteer");
}

export async function deleteVolunteerAction(formData: FormData) {
  const actor = await requireActorFromSession();
  const { id } = parseFormData(deleteSchema, formData);
  await deleteVolunteerOpportunity(actor, id);
  revalidatePath("/admin/volunteer");
}

export async function toggleVolunteerAction(formData: FormData) {
  const actor = await requireActorFromSession();
  const { id, isActive } = parseFormData(toggleSchema, formData);
  await updateVolunteerOpportunity(actor, id, { isActive: !isActive });
  revalidatePath("/admin/volunteer");
}

export async function updateVolunteerApplicationStatusAction(formData: FormData) {
  const actor = await requireActorFromSession();
  const { id, status } = parseFormData(updateVolunteerAppStatusSchema, formData);
  await updateVolunteerApplicationStatus(actor, id, status);
  revalidatePath("/admin/volunteer");
}
