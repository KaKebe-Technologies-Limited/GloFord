"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import {
  createVolunteerOpportunity,
  updateVolunteerOpportunity,
  deleteVolunteerOpportunity,
  updateVolunteerApplicationStatus,
} from "@/lib/services/volunteer";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function parseList(text: string | null): string[] {
  if (!text) return [];
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function createVolunteerAction(formData: FormData) {
  await requireActorFromSession();
  const title = formData.get("title") as string;
  const slug = (formData.get("slug") as string) || slugify(title);

  await createVolunteerOpportunity({
    title,
    slug,
    department: formData.get("department") as string,
    location: formData.get("location") as string,
    commitment: formData.get("commitment") as string,
    description: formData.get("description") as string,
    requirements: parseList(formData.get("requirements") as string),
    benefits: parseList(formData.get("benefits") as string),
  });
  revalidatePath("/admin/volunteer");
}

export async function updateVolunteerAction(formData: FormData) {
  await requireActorFromSession();
  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const slug = (formData.get("slug") as string) || slugify(title);

  await updateVolunteerOpportunity(id, {
    title,
    slug,
    department: formData.get("department") as string,
    location: formData.get("location") as string,
    commitment: formData.get("commitment") as string,
    description: formData.get("description") as string,
    requirements: parseList(formData.get("requirements") as string),
    benefits: parseList(formData.get("benefits") as string),
    isActive: formData.get("isActive") === "on",
  });
  revalidatePath("/admin/volunteer");
}

export async function deleteVolunteerAction(formData: FormData) {
  await requireActorFromSession();
  await deleteVolunteerOpportunity(formData.get("id") as string);
  revalidatePath("/admin/volunteer");
}

export async function toggleVolunteerAction(formData: FormData) {
  await requireActorFromSession();
  const id = formData.get("id") as string;
  const isActive = formData.get("isActive") === "true";
  await updateVolunteerOpportunity(id, { isActive: !isActive });
  revalidatePath("/admin/volunteer");
}

export async function updateVolunteerApplicationStatusAction(
  formData: FormData,
) {
  await requireActorFromSession();
  const id = formData.get("id") as string;
  const status = formData.get("status") as "SUBMITTED" | "APPROVED" | "REJECTED";
  await updateVolunteerApplicationStatus(id, status);
  revalidatePath("/admin/volunteer");
}
