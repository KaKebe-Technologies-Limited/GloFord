import { createService } from "@/lib/services/_shared";
import {
  eventCreateSchema,
  eventUpdateSchema,
  eventDeleteSchema,
  eventNotificationCreateSchema,
  eventNotificationUpdateSchema,
  eventNotificationDeleteSchema,
  eventNotificationSendNowSchema,
} from "@/lib/validators/events";
import { runAsTenant } from "@/lib/tenant/context";
import { inngest } from "@/lib/inngest/client";
import { ConflictError, NotFoundError } from "@/lib/errors";

// ───────────────────────────────────────────── Events ──

export const createEvent = createService({
  module: "events",
  action: "create",
  schema: eventCreateSchema,
  permission: () => ({ type: "Event" }),
  exec: async ({ input, actor, tx }) => {
    const existing = await tx.event.findUnique({
      where: { organizationId_slug: { organizationId: actor.orgId, slug: input.slug } },
      select: { id: true },
    });
    if (existing) throw new ConflictError("An event with this slug already exists");
    const { segmentIds, ...rest } = input;
    return tx.event.create({
      data: {
        organizationId: actor.orgId,
        ...rest,
        segments: segmentIds.length
          ? { connect: segmentIds.map((id) => ({ id })) }
          : undefined,
      },
    });
  },
  version: (out) => ({ entityType: "Event", entityId: out.id }),
});

export const updateEvent = createService({
  module: "events",
  action: "update",
  schema: eventUpdateSchema,
  permission: () => ({ type: "Event" }),
  loadBefore: async ({ input, tx }) => tx.event.findUnique({ where: { id: input.id } }),
  exec: async ({ input, actor, tx }) => {
    const { id, segmentIds, ...rest } = input;
    const row = await tx.event.findFirst({ where: { id, organizationId: actor.orgId } });
    if (!row) throw new NotFoundError("Event not found");
    return tx.event.update({
      where: { id },
      data: {
        ...rest,
        ...(segmentIds !== undefined && {
          segments: { set: segmentIds.map((sid) => ({ id: sid })) },
        }),
      },
    });
  },
  version: (out) => ({ entityType: "Event", entityId: out.id }),
});

export const deleteEvent = createService({
  module: "events",
  action: "delete",
  schema: eventDeleteSchema,
  permission: () => ({ type: "Event" }),
  exec: async ({ input, actor, tx }) => {
    const row = await tx.event.findFirst({
      where: { id: input.id, organizationId: actor.orgId },
      select: { id: true },
    });
    if (!row) throw new NotFoundError("Event not found");
    await tx.event.delete({ where: { id: input.id } });
    return { id: input.id };
  },
});

export function listEvents(orgId: string) {
  return runAsTenant(orgId, (tx) =>
    tx.event.findMany({
      where: { organizationId: orgId },
      orderBy: { startsAt: "desc" },
      include: { cover: { select: { url: true, alt: true } } },
    }),
  );
}

export async function getEventNotificationForEdit(
  orgId: string,
  id: string,
) {
  return runAsTenant(orgId, (tx) =>
    tx.eventNotification.findFirst({
      where: { id, event: { organizationId: orgId } },
      include: { event: { select: { id: true, title: true, slug: true } } },
    }),
  );
}

export function getEventForEdit(orgId: string, id: string) {
  return runAsTenant(orgId, (tx) =>
    tx.event.findFirst({
      where: { id, organizationId: orgId },
      include: {
        segments: { select: { id: true } },
        notifications: { orderBy: { sendAt: "asc" } },
      },
    }),
  );
}

// ──────────────────────────────────── Event notifications ──

export const createEventNotification = createService({
  module: "events",
  action: "update",
  schema: eventNotificationCreateSchema,
  permission: () => ({ type: "EventNotification" }),
  exec: async ({ input, actor, tx }) => {
    const event = await tx.event.findFirst({
      where: { id: input.eventId, organizationId: actor.orgId },
      select: { id: true },
    });
    if (!event) throw new NotFoundError("Event not found");
    return tx.eventNotification.create({
      data: {
        eventId: input.eventId,
        type: input.type,
        subject: input.subject,
        content: input.content as never,
        sendAt: input.sendAt,
      },
    });
  },
  version: (out) => ({ entityType: "EventNotification", entityId: out.id }),
});

export const updateEventNotification = createService({
  module: "events",
  action: "update",
  schema: eventNotificationUpdateSchema,
  permission: () => ({ type: "EventNotification" }),
  exec: async ({ input, actor, tx }) => {
    const { id, ...rest } = input;
    const notif = await tx.eventNotification.findUnique({
      where: { id },
      include: { event: { select: { organizationId: true } } },
    });
    if (!notif || notif.event.organizationId !== actor.orgId) {
      throw new NotFoundError("Notification not found");
    }
    if (notif.status === "SENT" || notif.status === "SENDING") {
      throw new ConflictError("Sent notifications cannot be edited");
    }
    return tx.eventNotification.update({
      where: { id },
      data: {
        ...(rest.type !== undefined && { type: rest.type }),
        ...(rest.subject !== undefined && { subject: rest.subject }),
        ...(rest.content !== undefined && { content: rest.content as never }),
        ...(rest.sendAt !== undefined && { sendAt: rest.sendAt }),
      },
    });
  },
  version: (out) => ({ entityType: "EventNotification", entityId: out.id }),
});

export const deleteEventNotification = createService({
  module: "events",
  action: "update",
  schema: eventNotificationDeleteSchema,
  permission: () => ({ type: "EventNotification" }),
  exec: async ({ input, actor, tx }) => {
    const notif = await tx.eventNotification.findUnique({
      where: { id: input.id },
      include: { event: { select: { organizationId: true } } },
    });
    if (!notif || notif.event.organizationId !== actor.orgId) {
      throw new NotFoundError("Notification not found");
    }
    if (notif.status === "SENT" || notif.status === "SENDING") {
      throw new ConflictError("Sent notifications cannot be deleted");
    }
    await tx.eventNotification.delete({ where: { id: input.id } });
    return { id: input.id };
  },
});

export const sendEventNotificationNow = createService({
  module: "events",
  action: "update",
  schema: eventNotificationSendNowSchema,
  permission: () => ({ type: "EventNotification" }),
  exec: async ({ input, actor, tx }) => {
    const notif = await tx.eventNotification.findUnique({
      where: { id: input.id },
      include: { event: { select: { organizationId: true, id: true } } },
    });
    if (!notif || notif.event.organizationId !== actor.orgId) {
      throw new NotFoundError("Notification not found");
    }
    if (notif.status === "SENT") {
      throw new ConflictError("Notification already sent");
    }
    const row = await tx.eventNotification.update({
      where: { id: input.id },
      data: { status: "SENDING", sendAt: new Date() },
    });
    const eventName = notif.type === "REMINDER" ? "event/reminder" : "event/announce";
    void inngest
      .send({
        name: eventName,
        data: { orgId: actor.orgId, eventId: notif.event.id, notificationId: row.id },
      })
      .catch(() => {});
    return row;
  },
});
