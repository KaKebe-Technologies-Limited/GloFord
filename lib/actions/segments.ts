"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import { createSegment, updateSegment, deleteSegment } from "@/lib/services/segments";

export async function createSegmentAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await createSegment(actor, raw);
  revalidatePath("/admin/segments");
}

export async function updateSegmentAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await updateSegment(actor, raw);
  revalidatePath("/admin/segments");
}

export async function deleteSegmentAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await deleteSegment(actor, raw);
  revalidatePath("/admin/segments");
}
