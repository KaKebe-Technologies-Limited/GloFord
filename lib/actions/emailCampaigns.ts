"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActorFromSession } from "@/lib/auth-context";
import {
  createEmailCampaign,
  updateEmailCampaign,
  deleteEmailCampaign,
  activateEmailCampaign,
  createCampaignEmail,
  updateCampaignEmail,
  deleteCampaignEmail,
} from "@/lib/services/emailCampaigns";

export async function createEmailCampaignAction(raw: unknown) {
  const actor = await requireActorFromSession();
  const row = await createEmailCampaign(actor, raw);
  revalidatePath("/admin/email-campaigns");
  redirect(`/admin/email-campaigns/${row.id}`);
}

export async function updateEmailCampaignAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await updateEmailCampaign(actor, raw);
  revalidatePath("/admin/email-campaigns");
}

export async function deleteEmailCampaignAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await deleteEmailCampaign(actor, raw);
  revalidatePath("/admin/email-campaigns");
  redirect("/admin/email-campaigns");
}

export async function activateEmailCampaignAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await activateEmailCampaign(actor, raw);
  revalidatePath("/admin/email-campaigns");
}

export async function createCampaignEmailAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await createCampaignEmail(actor, raw);
  revalidatePath("/admin/email-campaigns");
}

export async function updateCampaignEmailAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await updateCampaignEmail(actor, raw);
  revalidatePath("/admin/email-campaigns");
}

export async function deleteCampaignEmailAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await deleteCampaignEmail(actor, raw);
  revalidatePath("/admin/email-campaigns");
}
