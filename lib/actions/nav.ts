"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import {
  createNavItem,
  updateNavItem,
  deleteNavItem,
  reorderNavItems,
} from "@/lib/services/nav";

export async function createNavItemAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await createNavItem(actor, raw);
  revalidatePath("/admin/nav");
  revalidatePath("/", "layout");
}

export async function updateNavItemAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await updateNavItem(actor, raw);
  revalidatePath("/admin/nav");
  revalidatePath("/", "layout");
}

export async function deleteNavItemAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await deleteNavItem(actor, raw);
  revalidatePath("/admin/nav");
  revalidatePath("/", "layout");
}

export async function reorderNavItemsAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await reorderNavItems(actor, raw);
  revalidatePath("/admin/nav");
  revalidatePath("/", "layout");
}
