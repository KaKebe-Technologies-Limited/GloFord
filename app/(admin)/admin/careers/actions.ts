"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import {
  createCareer,
  updateCareer,
  deleteCareer,
  updateApplicationStatus,
} from "@/lib/services/careers";
import {
  parseFormData,
  createCareerSchema,
  updateCareerSchema,
  toggleSchema,
  deleteSchema,
  updateCareerAppStatusSchema,
} from "@/lib/validators/admin";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export async function createCareerAction(formData: FormData) {
  await requireActorFromSession();
  const data = parseFormData(createCareerSchema, formData);

  await createCareer({
    title: data.title,
    slug: slugify(data.title),
    department: data.department,
    location: data.location,
    type: data.type as "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "VOLUNTEER",
    description: data.description,
    salaryRange: data.salaryRange ?? undefined,
    applicationDeadline: data.applicationDeadline ?? undefined,
    requirements: data.requirements,
    responsibilities: data.responsibilities,
  });
  revalidatePath("/admin/careers");
}

export async function updateCareerAction(formData: FormData) {
  await requireActorFromSession();
  const data = parseFormData(updateCareerSchema, formData);

  await updateCareer(data.id, {
    title: data.title,
    slug: slugify(data.title),
    department: data.department,
    location: data.location,
    type: data.type as "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "VOLUNTEER",
    description: data.description,
    salaryRange: data.salaryRange,
    applicationDeadline: data.applicationDeadline,
    requirements: data.requirements,
    responsibilities: data.responsibilities,
    isActive: data.isActive,
  });
  revalidatePath("/admin/careers");
}

export async function deleteCareerAction(formData: FormData) {
  await requireActorFromSession();
  const { id } = parseFormData(deleteSchema, formData);
  await deleteCareer(id);
  revalidatePath("/admin/careers");
}

export async function toggleCareerAction(formData: FormData) {
  await requireActorFromSession();
  const { id, isActive } = parseFormData(toggleSchema, formData);
  await updateCareer(id, { isActive: !isActive });
  revalidatePath("/admin/careers");
}

export async function updateApplicationStatusAction(formData: FormData) {
  await requireActorFromSession();
  const data = parseFormData(updateCareerAppStatusSchema, formData);
  await updateApplicationStatus(data.id, data.status, data.notes ?? undefined);
  revalidatePath("/admin/careers");
}
