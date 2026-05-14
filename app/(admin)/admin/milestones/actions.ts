"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import {
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from "@/lib/services/milestones";
import {
  parseFormData,
  createMilestoneSchema,
  updateMilestoneSchema,
  toggleSchema,
  deleteSchema,
} from "@/lib/validators/admin";

export async function createMilestoneAction(formData: FormData) {
  await requireActorFromSession();
  const data = parseFormData(createMilestoneSchema, formData);
  await createMilestone({
    year: data.year,
    title: data.title,
    description: data.description,
    imageUrl: data.imageUrl,
    order: data.order,
  });
  revalidatePath("/admin/milestones");
}

export async function updateMilestoneAction(formData: FormData) {
  await requireActorFromSession();
  const { id, ...rest } = parseFormData(updateMilestoneSchema, formData);
  await updateMilestone(id, rest);
  revalidatePath("/admin/milestones");
}

export async function deleteMilestoneAction(formData: FormData) {
  await requireActorFromSession();
  const { id } = parseFormData(deleteSchema, formData);
  await deleteMilestone(id);
  revalidatePath("/admin/milestones");
}

export async function toggleMilestoneAction(formData: FormData) {
  await requireActorFromSession();
  const { id, isActive } = parseFormData(toggleSchema, formData);
  await updateMilestone(id, { isActive: !isActive });
  revalidatePath("/admin/milestones");
}
