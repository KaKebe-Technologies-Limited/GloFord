/**
 * Typed Inngest event catalog. Every event emitted by the service
 * layer must be declared here — the schema enforces payload shape at
 * `inngest.send()` call sites.
 */

import type { RoleName } from "@prisma/client";

type ActorPayload = {
  userId: string;
  role: RoleName;
  email: string;
};

export type GloforEvents = {
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

  "versioning/snapshot": {
    data: {
      entityType: string;
      entityId: string;
      before: unknown;
      after: unknown;
      actorId: string;
      reason?: string;
    };
  };

  "deadletter/enqueue": {
    data: {
      source: string;
      eventType: string;
      payload: unknown;
      error: string;
    };
  };

  "subscriber/signup": {
    data: { subscriberId: string; source?: string };
  };
  "subscriber/confirmed": {
    data: { subscriberId: string };
  };
  "subscriber/donation.succeeded": {
    data: {
      subscriberId: string;
      donationId: string;
      amountCents: number;
      currency: string;
    };
  };

  "newsletter/scheduled": {
    data: { newsletterId: string };
  };
  "newsletter/send": {
    data: { newsletterId: string };
  };
  "campaign/enroll": {
    data: { campaignId: string; subscriberId: string };
  };

  "event/announce": {
    data: { eventId: string; notificationId: string };
  };
  "event/reminder": {
    data: { eventId: string; notificationId: string };
  };

  "user/invite.send": {
    data: { email: string; name?: string };
  };

  "version/restore.apply": {
    data: {
      entityType: string;
      entityId: string;
      snapshot: unknown;
      actorId: string;
    };
  };
};
