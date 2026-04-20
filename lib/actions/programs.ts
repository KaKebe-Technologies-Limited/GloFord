"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActorFromSession } from "@/lib/auth-context";
import {
  createProgram,
  updateProgram,
  setProgramStatus,
  deleteProgram,
} from "@/lib/services/programs";

export async function createProgramAction(raw: unknown) {
  const actor = await requireActorFromSession();
  const row = await createProgram(actor, raw);
  revalidatePath("/admin/programs");
  redirect(`/admin/programs/${row.id}`);
}

export async function updateProgramAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await updateProgram(actor, raw);
  revalidatePath("/admin/programs");
}

export async function setProgramStatusAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await setProgramStatus(actor, raw);
  revalidatePath("/admin/programs");
}

export async function deleteProgramAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await deleteProgram(actor, raw);
  revalidatePath("/admin/programs");
  redirect("/admin/programs");
}
