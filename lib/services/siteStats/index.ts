import { db } from "@/lib/db";
import { revalidateTag, unstable_cache } from "next/cache";

const CACHE_TAG = "site-stats";

export const getActiveSiteStats = unstable_cache(
  async () => {
    return db.siteStatistic.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
  },
  ["site-stats-active"],
  { tags: [CACHE_TAG], revalidate: 3600 },
);

export async function getAllSiteStats() {
  return db.siteStatistic.findMany({ orderBy: { order: "asc" } });
}

export async function createSiteStat(data: {
  label: string;
  value: string;
  icon?: string;
  order?: number;
}) {
  const stat = await db.siteStatistic.create({ data });
  revalidateTag(CACHE_TAG);
  return stat;
}

export async function updateSiteStat(
  id: string,
  data: {
    label?: string;
    value?: string;
    icon?: string | null;
    order?: number;
    isActive?: boolean;
  },
) {
  const stat = await db.siteStatistic.update({ where: { id }, data });
  revalidateTag(CACHE_TAG);
  return stat;
}

export async function deleteSiteStat(id: string) {
  await db.siteStatistic.delete({ where: { id } });
  revalidateTag(CACHE_TAG);
}
