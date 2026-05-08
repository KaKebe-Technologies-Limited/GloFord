"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActorFromSession } from "@/lib/auth-context";
import {
  createPage,
  updatePage,
  setPageStatus,
  deletePage,
} from "@/lib/services/pages";

export async function createPageAction(raw: unknown) {
  const actor = await requireActorFromSession();
  const page = await createPage(actor, raw);
  revalidatePath("/admin/pages");
  redirect(`/admin/pages/${page.id}`);
}

export async function updatePageAction(raw: unknown) {
  const actor = await requireActorFromSession();
  const row = await updatePage(actor, raw);
  revalidatePath("/admin/pages");
  revalidatePath(`/admin/pages/${row.id}`);
}

export async function setPageStatusAction(raw: unknown) {
  const actor = await requireActorFromSession();
  const row = await setPageStatus(actor, raw);
  revalidatePath("/admin/pages");
  revalidatePath(`/admin/pages/${row.id}`);
}

export async function deletePageAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await deletePage(actor, raw);
  revalidatePath("/admin/pages");
  redirect("/admin/pages");
}
