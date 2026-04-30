import { randomBytes } from "node:crypto";
import { createService } from "@/lib/services/_shared";
import {
  subscribeSchema,
  subscriberUpdateSchema,
  subscriberDeleteSchema,
  subscriberAssignSegmentsSchema,
} from "@/lib/validators/subscribers";
import { db } from "@/lib/db";
import { getMailProvider } from "@/lib/mail";
import { doubleOptInEmail, welcomeEmail } from "@/lib/mail/templates";
import { buildBrand } from "@/lib/mail/brand";
import { NotFoundError } from "@/lib/errors";

/**
 * Public subscribe: creates a PENDING subscriber + sends the
 * double opt-in email. Idempotent on email.
 */
export async function publicSubscribe(
  raw: unknown,
): Promise<{ sent: boolean; alreadyActive: boolean }> {
  const input = subscribeSchema.parse(raw);
  const { subscriber, alreadyActive } = await db.$transaction(async (tx) => {
    const existing = await tx.subscriber.findUnique({ where: { email: input.email } });
    if (existing?.status === "ACTIVE") {
      return { subscriber: existing, alreadyActive: true };
    }
    const token = existing?.unsubToken ?? randomBytes(16).toString("hex");
    const row = await tx.subscriber.upsert({
      where: { email: input.email },
      update: {
        name: input.name ?? undefined,
        source: input.source ?? existing?.source ?? undefined,
      },
      create: {
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

  const brand = await buildBrand();
  const confirmUrl = `${brand.siteUrl}/newsletter/confirm/${subscriber.unsubToken}`;
  const { subject, html, text } = doubleOptInEmail({ brand, confirmUrl });

  await getMailProvider().send({
    to: input.email,
    subject,
    html,
    text,
    metadata: { type: "opt-in", subscriberId: subscriber.id },
  });

  return { sent: true, alreadyActive: false };
}

export async function confirmSubscriber(token: string): Promise<{ ok: boolean }> {
  const subscriber = await db.subscriber.findFirst({ where: { unsubToken: token } });
  if (!subscriber) throw new NotFoundError("Subscriber");
  if (subscriber.status === "ACTIVE") return { ok: true };

  await db.subscriber.update({
    where: { id: subscriber.id },
    data: { status: "ACTIVE", confirmedAt: new Date() },
  });

  const brand = await buildBrand();
  const { subject, html, text } = welcomeEmail({ brand });
  await getMailProvider().send({
    to: subscriber.email,
    subject,
    html,
    text,
    metadata: { type: "welcome", subscriberId: subscriber.id },
  });

  return { ok: true };
}

export async function unsubscribe(token: string) {
  return db.$transaction(async (tx) => {
    const subscriber = await tx.subscriber.findFirst({ where: { unsubToken: token } });
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

export async function listSubscribers({ page = 1, perPage = 50 }: { page?: number; perPage?: number } = {}) {
  const [rows, total] = await Promise.all([
    db.subscriber.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        segments: { include: { segment: { select: { slug: true, name: true } } } },
      },
    }),
    db.subscriber.count(),
  ]);
  return { rows, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

export function countActiveSubscribers() {
  return db.subscriber.count({ where: { status: "ACTIVE" } });
}
