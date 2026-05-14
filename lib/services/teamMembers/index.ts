import { db } from "@/lib/db";
import { revalidateTag, unstable_cache } from "next/cache";
import { authorize } from "@/lib/rbac/authorize";
import { inngest } from "@/lib/inngest/client";
import type { Actor } from "@/lib/tenant/context";

const CACHE_TAG = "team-members";

export const getActiveTeamMembers = unstable_cache(
  async () => {
    return db.teamMember.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
  },
  ["team-members-active"],
  { tags: [CACHE_TAG], revalidate: 3600 },
);

export async function getTeamMembersByDepartment() {
  const members = await db.teamMember.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
  const grouped: Record<string, typeof members> = {};
  for (const m of members) {
    const dept = m.department ?? "Leadership";
    (grouped[dept] ??= []).push(m);
  }
  return grouped;
}

export async function getAllTeamMembers() {
  return db.teamMember.findMany({ orderBy: { order: "asc" } });
}

export async function getTeamMember(id: string) {
  return db.teamMember.findUniqueOrThrow({ where: { id } });
}

export async function createTeamMember(
  actor: Actor,
  data: {
    name: string;
    role: string;
    bio?: string;
    photoUrl?: string;
    email?: string;
    phone?: string;
    department?: string;
    socialLinks?: Record<string, string>;
    order?: number;
  },
) {
  await authorize(actor, "teamMembers.create", { type: "TeamMember" });
  const m = await db.teamMember.create({ data });
  revalidateTag(CACHE_TAG);
  void inngest
    .send({
      name: "audit/log",
      data: {
        actor: { userId: actor.userId, role: actor.role as never, email: actor.email },
        action: "teamMembers.create",
        module: "teamMembers",
        entityType: "TeamMember",
        entityId: m.id,
      },
    })
    .catch(() => {});
  return m;
}

export async function updateTeamMember(
  actor: Actor,
  id: string,
  data: {
    name?: string;
    role?: string;
    bio?: string | null;
    photoUrl?: string | null;
    email?: string | null;
    phone?: string | null;
    department?: string | null;
    socialLinks?: Record<string, string>;
    order?: number;
    isActive?: boolean;
  },
) {
  await authorize(actor, "teamMembers.update", { type: "TeamMember", id });
  const m = await db.teamMember.update({ where: { id }, data });
  revalidateTag(CACHE_TAG);
  void inngest
    .send({
      name: "audit/log",
      data: {
        actor: { userId: actor.userId, role: actor.role as never, email: actor.email },
        action: "teamMembers.update",
        module: "teamMembers",
        entityType: "TeamMember",
        entityId: id,
      },
    })
    .catch(() => {});
  return m;
}

export async function deleteTeamMember(actor: Actor, id: string) {
  await authorize(actor, "teamMembers.delete", { type: "TeamMember", id });
  await db.teamMember.delete({ where: { id } });
  revalidateTag(CACHE_TAG);
  void inngest
    .send({
      name: "audit/log",
      data: {
        actor: { userId: actor.userId, role: actor.role as never, email: actor.email },
        action: "teamMembers.delete",
        module: "teamMembers",
        entityType: "TeamMember",
        entityId: id,
      },
    })
    .catch(() => {});
}
