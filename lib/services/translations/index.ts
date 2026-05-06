import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";

export function getTranslationOverrides(locale: string) {
  return unstable_cache(
    async () => {
      const rows = await db.translation.findMany({ where: { locale } });
      const map: Record<string, string> = {};
      for (const r of rows) map[r.key] = r.value;
      return map;
    },
    [`translations-${locale}`],
    { revalidate: 300, tags: [`translations-${locale}`] },
  )();
}

export async function listTranslations(locale: string) {
  return db.translation.findMany({
    where: { locale },
    orderBy: { key: "asc" },
  });
}

export async function upsertTranslation(locale: string, key: string, value: string) {
  return db.translation.upsert({
    where: { locale_key: { locale, key } },
    create: { locale, key, value },
    update: { value },
  });
}

export async function deleteTranslation(id: string) {
  return db.translation.delete({ where: { id } });
}

export async function bulkUpsertTranslations(
  locale: string,
  entries: Array<{ key: string; value: string }>,
) {
  return db.$transaction(
    entries.map((e) =>
      db.translation.upsert({
        where: { locale_key: { locale, key: e.key } },
        create: { locale, key: e.key, value: e.value },
        update: { value: e.value },
      }),
    ),
  );
}
