"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import {
  createLeaderMessage,
  updateLeaderMessage,
  deleteLeaderMessage,
} from "@/lib/services/leaderMessages";

export async function createLeaderMessageAction(formData: FormData) {
  await requireActorFromSession();
  await createLeaderMessage({
    leaderName: formData.get("leaderName") as string,
    title: formData.get("title") as string,
    role: formData.get("role") as string,
    photoUrl: (formData.get("photoUrl") as string) || undefined,
    message: formData.get("message") as string,
    signature: (formData.get("signature") as string) || undefined,
    order: Number(formData.get("order") || 0),
  });
  revalidatePath("/admin/leader-messages");
}

export async function updateLeaderMessageAction(formData: FormData) {
  await requireActorFromSession();
  const id = formData.get("id") as string;
  await updateLeaderMessage(id, {
    leaderName: formData.get("leaderName") as string,
    title: formData.get("title") as string,
    role: formData.get("role") as string,
    photoUrl: (formData.get("photoUrl") as string) || null,
    message: formData.get("message") as string,
    signature: (formData.get("signature") as string) || null,
    order: Number(formData.get("order") || 0),
    isActive: formData.get("isActive") === "on",
  });
  revalidatePath("/admin/leader-messages");
}

export async function deleteLeaderMessageAction(formData: FormData) {
  await requireActorFromSession();
  await deleteLeaderMessage(formData.get("id") as string);
  revalidatePath("/admin/leader-messages");
}

export async function toggleLeaderMessageAction(formData: FormData) {
  await requireActorFromSession();
  const id = formData.get("id") as string;
  const isActive = formData.get("isActive") === "true";
  await updateLeaderMessage(id, { isActive: !isActive });
  revalidatePath("/admin/leader-messages");
}
