import { db } from "@/lib/db";
import { revalidateTag, unstable_cache } from "next/cache";
import { authorize } from "@/lib/rbac/authorize";
import { inngest } from "@/lib/inngest/client";
import type { Actor } from "@/lib/tenant/context";

const CACHE_TAG = "volunteer";

export const getActiveVolunteerOpportunities = unstable_cache(
  async () => {
    return db.volunteerOpportunity.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { applications: true } } },
    });
  },
  ["volunteer-active"],
  { tags: [CACHE_TAG], revalidate: 3600 },
);

export async function getVolunteerBySlug(slug: string) {
  return db.volunteerOpportunity.findUniqueOrThrow({
    where: { slug },
    include: { _count: { select: { applications: true } } },
  });
}

export async function getAllVolunteerOpportunities() {
  return db.volunteerOpportunity.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { applications: true } } },
  });
}

export async function createVolunteerOpportunity(
  actor: Actor,
  data: {
    title: string;
    slug: string;
    department: string;
    location: string;
    commitment: string;
    description: string;
    requirements?: string[];
    benefits?: string[];
  },
) {
  await authorize(actor, "volunteer.create", { type: "VolunteerOpportunity" });
  const opp = await db.volunteerOpportunity.create({ data });
  revalidateTag(CACHE_TAG);
  void inngest
    .send({
      name: "audit/log",
      data: {
        actor: { userId: actor.userId, role: actor.role as never, email: actor.email },
        action: "volunteer.create",
        module: "volunteer",
        entityType: "VolunteerOpportunity",
        entityId: opp.id,
      },
    })
    .catch(() => {});
  return opp;
}

export async function updateVolunteerOpportunity(
  actor: Actor,
  id: string,
  data: {
    title?: string;
    slug?: string;
    department?: string;
    location?: string;
    commitment?: string;
    description?: string;
    requirements?: string[];
    benefits?: string[];
    isActive?: boolean;
  },
) {
  await authorize(actor, "volunteer.update", { type: "VolunteerOpportunity", id });
  const opp = await db.volunteerOpportunity.update({ where: { id }, data });
  revalidateTag(CACHE_TAG);
  void inngest
    .send({
      name: "audit/log",
      data: {
        actor: { userId: actor.userId, role: actor.role as never, email: actor.email },
        action: "volunteer.update",
        module: "volunteer",
        entityType: "VolunteerOpportunity",
        entityId: id,
      },
    })
    .catch(() => {});
  return opp;
}

export async function deleteVolunteerOpportunity(actor: Actor, id: string) {
  await authorize(actor, "volunteer.delete", { type: "VolunteerOpportunity", id });
  await db.volunteerOpportunity.delete({ where: { id } });
  revalidateTag(CACHE_TAG);
  void inngest
    .send({
      name: "audit/log",
      data: {
        actor: { userId: actor.userId, role: actor.role as never, email: actor.email },
        action: "volunteer.delete",
        module: "volunteer",
        entityType: "VolunteerOpportunity",
        entityId: id,
      },
    })
    .catch(() => {});
}

export async function submitVolunteerApplication(data: {
  opportunityId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  motivation?: string;
  availability?: string;
  skills?: string[];
}) {
  return db.volunteerApplication.create({ data });
}

export async function getApplicationsForOpportunity(opportunityId: string) {
  return db.volunteerApplication.findMany({
    where: { opportunityId },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateVolunteerApplicationStatus(
  actor: Actor,
  id: string,
  status: "SUBMITTED" | "APPROVED" | "REJECTED",
) {
  await authorize(actor, "volunteer.updateStatus", { type: "VolunteerApplication", id });
  return db.volunteerApplication.update({
    where: { id },
    data: { status },
  });
}
