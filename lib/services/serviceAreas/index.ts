import { db } from "@/lib/db";
import { revalidateTag, unstable_cache } from "next/cache";

const CACHE_TAG = "service-areas";

export const getActiveServiceAreas = unstable_cache(
  async () => {
    return db.serviceArea.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
  },
  ["service-areas-active"],
  { tags: [CACHE_TAG], revalidate: 3600 },
);

export async function listServiceAreas() {
  return db.serviceArea.findMany({ orderBy: { order: "asc" } });
}

export async function createServiceArea(data: {
  title: string;
  description: string;
  icon?: string;
  color?: string;
  order?: number;
}) {
  const area = await db.serviceArea.create({ data });
  revalidateTag(CACHE_TAG);
  return area;
}

export async function updateServiceArea(
  id: string,
  data: {
    title?: string;
    description?: string;
    icon?: string;
    color?: string;
    order?: number;
    isActive?: boolean;
  },
) {
  const area = await db.serviceArea.update({ where: { id }, data });
  revalidateTag(CACHE_TAG);
  return area;
}

export async function deleteServiceArea(id: string) {
  await db.serviceArea.delete({ where: { id } });
  revalidateTag(CACHE_TAG);
}
