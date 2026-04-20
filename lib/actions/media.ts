"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import { finalizeMediaUpload, deleteMedia } from "@/lib/services/media";

export async function finalizeMediaAction(raw: unknown) {
  const actor = await requireActorFromSession();
  const row = await finalizeMediaUpload(actor, raw);
  revalidatePath("/admin/media");
  return row;
}

export async function deleteMediaAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await deleteMedia(actor, raw);
  revalidatePath("/admin/media");
}
