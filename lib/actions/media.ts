"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import { finalizeMediaUpload, deleteMedia, listMedia } from "@/lib/services/media";

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

/**
 * Returns a paginated Media slice for the ImagePicker component.
 * Image-only, newest first. Auth-gated so you can't scrape the
 * library from the public site.
 */
export async function listMediaForPickerAction(opts?: { take?: number }) {
  await requireActorFromSession();
  const rows = await listMedia(opts?.take ?? 120);
  return rows
    .filter((r) => r.mime.startsWith("image/"))
    .map((r) => ({
      id: r.id,
      url: r.url,
      alt: r.alt ?? "",
      mime: r.mime,
      width: r.width,
      height: r.height,
    }));
}
