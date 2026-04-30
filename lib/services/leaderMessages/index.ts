import { db } from "@/lib/db";
import { revalidateTag, unstable_cache } from "next/cache";

const CACHE_TAG = "leader-messages";

export const getActiveLeaderMessages = unstable_cache(
  async () => {
    return db.leaderMessage.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
  },
  ["leader-messages-active"],
  { tags: [CACHE_TAG], revalidate: 3600 },
);

export async function getAllLeaderMessages() {
  return db.leaderMessage.findMany({ orderBy: { order: "asc" } });
}

export async function createLeaderMessage(data: {
  leaderName: string;
  title: string;
  role: string;
  photoUrl?: string;
  message: string;
  signature?: string;
  order?: number;
}) {
  const m = await db.leaderMessage.create({ data });
  revalidateTag(CACHE_TAG);
  return m;
}

export async function updateLeaderMessage(
  id: string,
  data: {
    leaderName?: string;
    title?: string;
    role?: string;
    photoUrl?: string | null;
    message?: string;
    signature?: string | null;
    order?: number;
    isActive?: boolean;
  },
) {
  const m = await db.leaderMessage.update({ where: { id }, data });
  revalidateTag(CACHE_TAG);
  return m;
}

export async function deleteLeaderMessage(id: string) {
  await db.leaderMessage.delete({ where: { id } });
  revalidateTag(CACHE_TAG);
}
