"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import {
  retryDeadLetter,
  resolveDeadLetter,
  restoreVersion,
  upsertFeatureFlag,
  deleteFeatureFlag,
} from "@/lib/services/system/mutations";

export async function retryDeadLetterAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await retryDeadLetter(actor, raw);
  revalidatePath("/admin/system/dead-letter");
}

export async function resolveDeadLetterAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await resolveDeadLetter(actor, raw);
  revalidatePath("/admin/system/dead-letter");
}

export async function restoreVersionAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await restoreVersion(actor, raw);
  revalidatePath("/admin/system/versions");
}

export async function upsertFeatureFlagAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await upsertFeatureFlag(actor, raw);
  revalidatePath("/admin/system/feature-flags");
}

export async function deleteFeatureFlagAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await deleteFeatureFlag(actor, raw);
  revalidatePath("/admin/system/feature-flags");
}
