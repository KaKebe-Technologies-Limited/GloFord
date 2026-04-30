"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import {
  createCareer,
  updateCareer,
  deleteCareer,
  updateApplicationStatus,
} from "@/lib/services/careers";

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
  const title = formData.get("title") as string;
  const deadline = formData.get("applicationDeadline") as string;

  await createCareer({
    title,
    slug: slugify(title),
    department: formData.get("department") as string,
    location: formData.get("location") as string,
    type: (formData.get("type") as "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "VOLUNTEER") || undefined,
    description: formData.get("description") as string,
    salaryRange: (formData.get("salaryRange") as string) || undefined,
    applicationDeadline: deadline ? new Date(deadline) : undefined,
    requirements: parseList(formData.get("requirements") as string),
    responsibilities: parseList(formData.get("responsibilities") as string),
  });
  revalidatePath("/admin/careers");
}

export async function updateCareerAction(formData: FormData) {
  await requireActorFromSession();
  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const deadline = formData.get("applicationDeadline") as string;

  await updateCareer(id, {
    title,
    slug: slugify(title),
    department: formData.get("department") as string,
    location: formData.get("location") as string,
    type: (formData.get("type") as "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "VOLUNTEER") || undefined,
    description: formData.get("description") as string,
    salaryRange: (formData.get("salaryRange") as string) || null,
    applicationDeadline: deadline ? new Date(deadline) : null,
    requirements: parseList(formData.get("requirements") as string),
    responsibilities: parseList(formData.get("responsibilities") as string),
    isActive: formData.get("isActive") === "on",
  });
  revalidatePath("/admin/careers");
}

export async function deleteCareerAction(formData: FormData) {
  await requireActorFromSession();
  await deleteCareer(formData.get("id") as string);
  revalidatePath("/admin/careers");
}

export async function toggleCareerAction(formData: FormData) {
  await requireActorFromSession();
  const id = formData.get("id") as string;
  const isActive = formData.get("isActive") === "true";
  await updateCareer(id, { isActive: !isActive });
  revalidatePath("/admin/careers");
}

export async function updateApplicationStatusAction(formData: FormData) {
  await requireActorFromSession();
  const id = formData.get("id") as string;
  const status = formData.get("status") as "SUBMITTED" | "REVIEWING" | "SHORTLISTED" | "INTERVIEW" | "OFFERED" | "REJECTED" | "WITHDRAWN";
  const notes = (formData.get("notes") as string) || undefined;
  await updateApplicationStatus(id, status, notes);
  revalidatePath("/admin/careers");
}

function parseList(text: string | null): string[] {
  if (!text) return [];
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
