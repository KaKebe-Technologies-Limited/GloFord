"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActorFromSession } from "@/lib/auth-context";
import { db } from "@/lib/db";
import {
  createNewsletter,
  updateNewsletter,
  scheduleNewsletter,
  sendNewsletterNow,
  deleteNewsletter,
} from "@/lib/services/newsletters";

export async function createNewsletterAction(raw: unknown) {
  const actor = await requireActorFromSession();
  const row = await createNewsletter(actor, raw);
  revalidatePath("/admin/newsletters");
  redirect(`/admin/newsletters/${row.id}`);
}

export async function updateNewsletterAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await updateNewsletter(actor, raw);
  revalidatePath("/admin/newsletters");
}

export async function scheduleNewsletterAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await scheduleNewsletter(actor, raw);
  revalidatePath("/admin/newsletters");
}

export async function sendNewsletterAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await sendNewsletterNow(actor, raw);
  revalidatePath("/admin/newsletters");
}

export async function deleteNewsletterAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await deleteNewsletter(actor, raw);
  revalidatePath("/admin/newsletters");
  redirect("/admin/newsletters");
}

export async function previewAudienceCountAction(
  segmentIds: string[],
): Promise<number> {
  await requireActorFromSession();
  if (segmentIds.length === 0) {
    return db.subscriber.count({ where: { status: "ACTIVE" } });
  }
  const count = await db.subscriber.count({
    where: {
      status: "ACTIVE",
      segments: { some: { segmentId: { in: segmentIds } } },
    },
  });
  return count;
}
