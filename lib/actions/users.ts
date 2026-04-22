"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import { inviteUser, updateUserRole, deactivateUser } from "@/lib/services/users";

export async function inviteUserAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await inviteUser(actor, raw);
  revalidatePath("/admin/users");
}

export async function updateUserRoleAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await updateUserRole(actor, raw);
  revalidatePath("/admin/users");
}

export async function deactivateUserAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await deactivateUser(actor, raw);
  revalidatePath("/admin/users");
}
