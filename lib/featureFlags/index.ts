import { unstable_cache, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { tags } from "@/lib/cache";
import { logger } from "@/lib/observability/log";

/**
 * Feature-flag SDK. Cached per key with revalidation tags so flipping
 * a flag in the admin UI invalidates cached reads everywhere.
 *
 * Percent rollout is optional and lives in the `rules` JSON column:
 *   { "rolloutPct": 25 }  // 25% of subjects see the feature
 * Absent / malformed rules = binary isEnabled.
 */

type FlagState = { enabled: boolean; rolloutPct?: number };

function parseRules(r: unknown): { rolloutPct?: number } {
  if (!r || typeof r !== "object") return {};
  const pct = (r as { rolloutPct?: unknown }).rolloutPct;
  if (typeof pct === "number" && pct >= 0 && pct <= 100) return { rolloutPct: pct };
  return {};
}

async function loadRaw(key: string): Promise<FlagState | null> {
  try {
    const row = await db.featureFlag.findUnique({
      where: { key },
      select: { isEnabled: true, rules: true },
    });
    if (!row) return null;
    return { enabled: row.isEnabled, ...parseRules(row.rules) };
  } catch (err) {
    void logger.warn("featureFlag.lookup.failed", {
      key,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export async function isFeatureEnabled(key: string, fallback = false): Promise<boolean> {
  const state = await unstable_cache(
    () => loadRaw(key),
    [`ff`, key],
    { tags: [tags.featureFlags()], revalidate: 60 },
  )();
  if (!state) return fallback;
  return state.enabled;
}

export async function isFeatureEnabledForSubject(
  key: string,
  subjectId: string,
  fallback = false,
): Promise<boolean> {
  const state = await unstable_cache(
    () => loadRaw(key),
    [`ff`, key],
    { tags: [tags.featureFlags()], revalidate: 60 },
  )();
  if (!state) return fallback;
  if (!state.enabled) return false;
  if (state.rolloutPct === undefined || state.rolloutPct >= 100) return true;
  if (state.rolloutPct <= 0) return false;
  const bucket = hash32(`${key}:${subjectId}`) % 100;
  return bucket < state.rolloutPct;
}

function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function invalidateFeatureFlagCache() {
  revalidateTag(tags.featureFlags());
}
