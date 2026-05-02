import { db } from "@/lib/db";
import type { EventRsvpStatus } from "@prisma/client";

/**
 * Public event registration — no auth required.
 * Uses email as the identity key (one RSVP per email per event).
 */
export async function registerForEvent(input: {
  eventId: string;
  email: string;
  name?: string;
  status?: EventRsvpStatus;
}) {
  const event = await db.event.findUnique({
    where: { id: input.eventId },
    select: { id: true, isPublic: true, capacity: true, _count: { select: { registrations: { where: { status: "GOING" } } } } },
  });
  if (!event) throw new Error("Event not found");
  if (!event.isPublic) throw new Error("Event is not public");

  if (event.capacity && event._count.registrations >= event.capacity && input.status === "GOING") {
    throw new Error("Event is at capacity");
  }

  return db.eventRegistration.upsert({
    where: { eventId_email: { eventId: input.eventId, email: input.email } },
    update: { status: input.status ?? "GOING", name: input.name },
    create: {
      eventId: input.eventId,
      email: input.email,
      name: input.name,
      status: input.status ?? "GOING",
    },
  });
}

export async function cancelRegistration(eventId: string, email: string) {
  return db.eventRegistration.update({
    where: { eventId_email: { eventId, email } },
    data: { status: "CANCELED" },
  });
}

export async function getEventRegistrations(eventId: string) {
  return db.eventRegistration.findMany({
    where: { eventId },
    orderBy: { registeredAt: "desc" },
  });
}

export async function getRegistrationCounts(eventId: string) {
  const [going, interested] = await Promise.all([
    db.eventRegistration.count({ where: { eventId, status: "GOING" } }),
    db.eventRegistration.count({ where: { eventId, status: "INTERESTED" } }),
  ]);
  return { going, interested };
}

export async function getRegistrationForEmail(eventId: string, email: string) {
  return db.eventRegistration.findUnique({
    where: { eventId_email: { eventId, email } },
  });
}
