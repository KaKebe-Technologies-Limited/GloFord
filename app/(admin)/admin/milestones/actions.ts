"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import {
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from "@/lib/services/milestones";

export async function createMilestoneAction(formData: FormData) {
  await requireActorFromSession();
  await createMilestone({
    year: formData.get("year") as string,
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    imageUrl: (formData.get("imageUrl") as string) || null,
    order: Number(formData.get("order") || 0),
  });
  revalidatePath("/admin/milestones");
}

export async function updateMilestoneAction(formData: FormData) {
  await requireActorFromSession();
  const id = formData.get("id") as string;
  await updateMilestone(id, {
    year: formData.get("year") as string,
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    imageUrl: (formData.get("imageUrl") as string) || null,
    order: Number(formData.get("order") || 0),
    isActive: formData.get("isActive") === "on",
  });
  revalidatePath("/admin/milestones");
}

export async function deleteMilestoneAction(formData: FormData) {
  await requireActorFromSession();
  const id = formData.get("id") as string;
  await deleteMilestone(id);
  revalidatePath("/admin/milestones");
}

export async function toggleMilestoneAction(formData: FormData) {
  await requireActorFromSession();
  const id = formData.get("id") as string;
  const isActive = formData.get("isActive") === "true";
  await updateMilestone(id, { isActive: !isActive });
  revalidatePath("/admin/milestones");
}
