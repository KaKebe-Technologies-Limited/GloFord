"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import {
  createLeaderMessage,
  updateLeaderMessage,
  deleteLeaderMessage,
} from "@/lib/services/leaderMessages";
import {
  parseFormData,
  createLeaderMessageSchema,
  updateLeaderMessageSchema,
  toggleSchema,
  deleteSchema,
} from "@/lib/validators/admin";

export async function createLeaderMessageAction(formData: FormData) {
  await requireActorFromSession();
  const data = parseFormData(createLeaderMessageSchema, formData);
  await createLeaderMessage({
    leaderName: data.leaderName,
    title: data.title,
    role: data.role,
    photoUrl: data.photoUrl ?? undefined,
    message: data.message,
    signature: data.signature ?? undefined,
    order: data.order,
  });
  revalidatePath("/admin/leader-messages");
}

export async function updateLeaderMessageAction(formData: FormData) {
  await requireActorFromSession();
  const { id, ...rest } = parseFormData(updateLeaderMessageSchema, formData);
  await updateLeaderMessage(id, rest);
  revalidatePath("/admin/leader-messages");
}

export async function deleteLeaderMessageAction(formData: FormData) {
  await requireActorFromSession();
  const { id } = parseFormData(deleteSchema, formData);
  await deleteLeaderMessage(id);
  revalidatePath("/admin/leader-messages");
}

export async function toggleLeaderMessageAction(formData: FormData) {
  await requireActorFromSession();
  const { id, isActive } = parseFormData(toggleSchema, formData);
  await updateLeaderMessage(id, { isActive: !isActive });
  revalidatePath("/admin/leader-messages");
}
