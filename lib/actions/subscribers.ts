"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import { NotFoundError } from "@/lib/errors";
import { db } from "@/lib/db";
import {
  publicSubscribe,
  confirmSubscriber,
  unsubscribe,
  updateSubscriber,
  deleteSubscriber,
  assignSubscriberSegments,
} from "@/lib/services/subscribers";

async function resolveOrgId() {
  const org = await db.organization.findFirst({
    where: { isActive: true },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (!org) throw new NotFoundError("Organization");
  return org.id;
}

export async function subscribeAction(raw: unknown) {
  const orgId = await resolveOrgId();
  return publicSubscribe(orgId, raw);
}

export async function confirmSubscriberAction(token: string) {
  const orgId = await resolveOrgId();
  return confirmSubscriber(orgId, token);
}

export async function unsubscribeAction(token: string) {
  const orgId = await resolveOrgId();
  return unsubscribe(orgId, token);
}

export async function updateSubscriberAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await updateSubscriber(actor, raw);
  revalidatePath("/admin/subscribers");
}

export async function deleteSubscriberAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await deleteSubscriber(actor, raw);
  revalidatePath("/admin/subscribers");
}

export async function assignSubscriberSegmentsAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await assignSubscriberSegments(actor, raw);
  revalidatePath("/admin/subscribers");
}
