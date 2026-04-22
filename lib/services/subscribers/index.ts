import { randomBytes } from "node:crypto";
import { createService } from "@/lib/services/_shared";
import {
  subscribeSchema,
  subscriberUpdateSchema,
  subscriberDeleteSchema,
  subscriberAssignSegmentsSchema,
} from "@/lib/validators/subscribers";
import { runAsTenant } from "@/lib/tenant/context";
import { getMailProvider } from "@/lib/mail";
import { doubleOptInEmail, welcomeEmail } from "@/lib/mail/templates";
import { buildBrand } from "@/lib/mail/brand";
import { NotFoundError } from "@/lib/errors";

/**
 * Public subscribe: creates a PENDING subscriber + sends the
 * double opt-in email. Idempotent on (org, email): hitting signup
 * again resends the confirmation instead of creating duplicates.
 *
 * Not wrapped in createService — no actor, no RBAC. The calling
 * route must resolve the org first.
 */
export async function publicSubscribe(
  orgId: string,
  raw: unknown,
): Promise<{ sent: boolean; alreadyActive: boolean }> {
  const input = subscribeSchema.parse(raw);
  const { subscriber, alreadyActive } = await runAsTenant(orgId, async (tx) => {
    const existing = await tx.subscriber.findUnique({
      where: { organizationId_email: { organizationId: orgId, email: input.email } },
    });
    if (existing?.status === "ACTIVE") {
      return { subscriber: existing, alreadyActive: true };
    }
    const token = existing?.unsubToken ?? randomBytes(16).toString("hex");
    const row = await tx.subscriber.upsert({
      where: { organizationId_email: { organizationId: orgId, email: input.email } },
      update: {
        name: input.name ?? undefined,
        source: input.source ?? existing?.source ?? undefined,
      },
      create: {
        organizationId: orgId,
        email: input.email,
        name: input.name,
        source: input.source,
        status: "PENDING",
        unsubToken: token,
      },
    });
    return { subscriber: row, alreadyActive: false };
  });

  if (alreadyActive) return { sent: false, alreadyActive: true };

  // Use a deterministic confirm token tied to the subscriber id for
  // this launch. A proper flow would persist the token with an
  // expiry column — deferred until we add email verification for
  // user accounts (the same mechanism works for both).
  const brand = await buildBrand(orgId);
  const confirmUrl = `${brand.siteUrl}/newsletter/confirm/${subscriber.unsubToken}`;
  const { subject, html, text } = doubleOptInEmail({ brand, confirmUrl });

  await getMailProvider().send({
    to: input.email,
    subject,
    html,
    text,
    metadata: { type: "opt-in", orgId, subscriberId: subscriber.id },
  });

  return { sent: true, alreadyActive: false };
}

/**
 * Confirm via the one-time unsub/confirm token from the email link.
 * Flips PENDING -> ACTIVE and sends a welcome email.
 */
export async function confirmSubscriber(
  orgId: string,
  token: string,
): Promise<{ ok: boolean }> {
  const subscriber = await runAsTenant(orgId, (tx) =>
    tx.subscriber.findFirst({
      where: { organizationId: orgId, unsubToken: token },
    }),
  );
  if (!subscriber) throw new NotFoundError("Subscriber");
  if (subscriber.status === "ACTIVE") return { ok: true };

  await runAsTenant(orgId, (tx) =>
    tx.subscriber.update({
      where: { id: subscriber.id },
      data: { status: "ACTIVE", confirmedAt: new Date() },
    }),
  );

  const brand = await buildBrand(orgId);
  const { subject, html, text } = welcomeEmail({ brand });
  await getMailProvider().send({
    to: subscriber.email,
    subject,
    html,
    text,
    metadata: { type: "welcome", orgId, subscriberId: subscriber.id },
  });

  return { ok: true };
}

/**
 * One-click unsubscribe from the same token embedded in every
 * outgoing newsletter. Safe to hit repeatedly.
 */
export async function unsubscribe(orgId: string, token: string) {
  return runAsTenant(orgId, async (tx) => {
    const subscriber = await tx.subscriber.findFirst({
      where: { organizationId: orgId, unsubToken: token },
    });
    if (!subscriber) throw new NotFoundError("Subscriber");
    if (subscriber.status === "UNSUBSCRIBED") return { ok: true };
    await tx.subscriber.update({
      where: { id: subscriber.id },
      data: { status: "UNSUBSCRIBED" },
    });
    return { ok: true };
  });
}

// ─── Admin service layer (RBAC-gated) ───────────────────────

export const updateSubscriber = createService({
  module: "subscribers",
  action: "update",
  schema: subscriberUpdateSchema,
  permission: () => ({ type: "Subscriber" }),
  exec: async ({ input, tx }) => {
    const { id, ...rest } = input;
    return tx.subscriber.update({
      where: { id },
      data: {
        ...(rest.name !== undefined && { name: rest.name }),
        ...(rest.status !== undefined && { status: rest.status }),
      },
    });
  },
});

export const deleteSubscriber = createService({
  module: "subscribers",
  action: "delete",
  schema: subscriberDeleteSchema,
  permission: () => ({ type: "Subscriber" }),
  exec: async ({ input, tx }) => {
    await tx.subscriber.delete({ where: { id: input.id } });
    return { id: input.id };
  },
});

export const assignSubscriberSegments = createService({
  module: "subscribers",
  action: "update",
  schema: subscriberAssignSegmentsSchema,
  permission: () => ({ type: "Subscriber" }),
  exec: async ({ input, tx }) => {
    await tx.subscriberSegment.deleteMany({
      where: { subscriberId: input.id, source: "MANUAL" },
    });
    if (input.segmentIds.length > 0) {
      await tx.subscriberSegment.createMany({
        data: input.segmentIds.map((segmentId) => ({
          subscriberId: input.id,
          segmentId,
          source: "MANUAL",
        })),
        skipDuplicates: true,
      });
    }
    return { id: input.id };
  },
});

export function listSubscribers(orgId: string, take = 200) {
  return runAsTenant(orgId, (tx) =>
    tx.subscriber.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take,
      include: {
        segments: { include: { segment: { select: { slug: true, name: true } } } },
      },
    }),
  );
}

export function countActiveSubscribers(orgId: string) {
  return runAsTenant(orgId, (tx) =>
    tx.subscriber.count({
      where: { organizationId: orgId, status: "ACTIVE" },
    }),
  );
}
