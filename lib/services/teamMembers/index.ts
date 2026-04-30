import { db } from "@/lib/db";
import { revalidateTag, unstable_cache } from "next/cache";

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

export async function createTeamMember(data: {
  name: string;
  role: string;
  bio?: string;
  photoUrl?: string;
  email?: string;
  phone?: string;
  department?: string;
  socialLinks?: Record<string, string>;
  order?: number;
}) {
  const m = await db.teamMember.create({ data });
  revalidateTag(CACHE_TAG);
  return m;
}

export async function updateTeamMember(
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
  const m = await db.teamMember.update({ where: { id }, data });
  revalidateTag(CACHE_TAG);
  return m;
}

export async function deleteTeamMember(id: string) {
  await db.teamMember.delete({ where: { id } });
  revalidateTag(CACHE_TAG);
}
