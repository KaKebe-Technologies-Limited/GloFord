"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActorFromSession } from "@/lib/auth-context";
import {
  createCampaign,
  updateCampaign,
  deleteCampaign,
  toggleCampaign,
} from "@/lib/services/campaigns";

export async function createCampaignAction(raw: unknown) {
  const actor = await requireActorFromSession();
  const row = await createCampaign(actor, raw);
  revalidatePath("/admin/campaigns");
  redirect(`/admin/campaigns/${row.id}`);
}

export async function updateCampaignAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await updateCampaign(actor, raw);
  revalidatePath("/admin/campaigns");
}

export async function toggleCampaignAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await toggleCampaign(actor, raw);
  revalidatePath("/admin/campaigns");
}

export async function deleteCampaignAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await deleteCampaign(actor, raw);
  revalidatePath("/admin/campaigns");
  redirect("/admin/campaigns");
}
