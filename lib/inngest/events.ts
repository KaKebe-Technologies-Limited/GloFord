/**
 * Typed Inngest event catalog. Every event emitted by the service
 * layer must be declared here — the schema enforces payload shape at
 * `inngest.send()` call sites.
 */

import type { RoleName } from "@prisma/client";

type ActorPayload = {
  userId: string;
  orgId: string;
  role: RoleName;
  email: string;
};

export type GloforEvents = {
  // ─── Audit ─────────────────────────────────────────────
  "audit/log": {
    data: {
      actor: ActorPayload | null;
      action: string;
      module: string;
      entityType?: string;
      entityId?: string;
      diff?: unknown;
      correlationId?: string;
      request?: { ip?: string; userAgent?: string };
    };
  };

  // ─── Versioning ────────────────────────────────────────
  "versioning/snapshot": {
    data: {
      orgId: string;
      entityType: string;
      entityId: string;
      before: unknown;
      after: unknown;
      actorId: string;
      reason?: string;
    };
  };

  // ─── Dead-letter ───────────────────────────────────────
  "deadletter/enqueue": {
    data: {
      orgId?: string;
      source: string;
      eventType: string;
      payload: unknown;
      error: string;
    };
  };

  // ─── Subscriber lifecycle ──────────────────────────────
  "subscriber/signup": {
    data: { orgId: string; subscriberId: string; source?: string };
  };
  "subscriber/confirmed": {
    data: { orgId: string; subscriberId: string };
  };
  "subscriber/donation.succeeded": {
    data: {
      orgId: string;
      subscriberId: string;
      donationId: string;
      amountCents: number;
      currency: string;
    };
  };

  // ─── Newsletter & campaigns ────────────────────────────
  "newsletter/scheduled": {
    data: { orgId: string; newsletterId: string };
  };
  "newsletter/send": {
    data: { orgId: string; newsletterId: string };
  };
  "campaign/enroll": {
    data: { orgId: string; campaignId: string; subscriberId: string };
  };

  // ─── Events (the domain kind) ──────────────────────────
  "event/announce": {
    data: { orgId: string; eventId: string; notificationId: string };
  };
  "event/reminder": {
    data: { orgId: string; eventId: string; notificationId: string };
  };
};
