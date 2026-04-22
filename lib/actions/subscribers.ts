"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";
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
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown";
  const rl = await rateLimit({
    bucket: "newsletter-subscribe",
    identifier: ip,
    limit: 5,
    windowSeconds: 600, // 5 sign-ups per 10 min per IP
  });
  if (!rl.ok) {
    throw new ValidationError(
      `Too many sign-up attempts. Try again after ${rl.resetAt.toLocaleTimeString()}.`,
    );
  }
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
