import { db } from "@/lib/db";

export async function getSiteImage(key: string) {
  return db.siteImage.findUnique({ where: { key } });
}

export async function getSiteImages(keys: string[]) {
  const rows = await db.siteImage.findMany({ where: { key: { in: keys } } });
  const map = new Map(rows.map((r) => [r.key, r]));
  return map;
}

export async function listSiteImages() {
  return db.siteImage.findMany({ orderBy: { key: "asc" } });
}

export async function upsertSiteImage(data: {
  key: string;
  label: string;
  url: string;
  alt?: string | null;
}) {
  return db.siteImage.upsert({
    where: { key: data.key },
    create: data,
    update: { label: data.label, url: data.url, alt: data.alt },
  });
}

export async function deleteSiteImage(id: string) {
  return db.siteImage.delete({ where: { id } });
}
