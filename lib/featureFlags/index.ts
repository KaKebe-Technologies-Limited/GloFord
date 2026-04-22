import { unstable_cache, revalidateTag } from "next/cache";
import { runAsSystem, runAsTenant } from "@/lib/tenant/context";
import { tags } from "@/lib/cache";
import { logger } from "@/lib/observability/log";

/**
 * Feature-flag SDK. Cached per (orgId, key) with revalidation tags so
 * flipping a flag in the admin UI invalidates cached reads everywhere.
 *
 * Tenant rows override global (organizationId=null) rows with the
 * same key. If neither exists, the caller-supplied fallback wins.
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

async function loadRaw(orgId: string, key: string): Promise<FlagState | null> {
  // Resilience: a DB outage on the flag lookup must never cascade into
  // the caller's request. We fall back to "undecided" (null) and let
  // the caller apply its own `fallback` value. Individual failures get
  // swallowed + logged per-branch so a partial outage still returns
  // whatever branch is working.
  const [orgRow, globalRow] = await Promise.all([
    runAsTenant(orgId, (tx) =>
      tx.featureFlag.findFirst({
        where: { organizationId: orgId, key },
        select: { isEnabled: true, rules: true },
      }),
    ).catch((err) => {
      void logger.warn("featureFlag.tenant.lookup.failed", {
        key,
        orgId,
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    }),
    runAsSystem((tx) =>
      tx.featureFlag.findFirst({
        where: { organizationId: null, key },
        select: { isEnabled: true, rules: true },
      }),
    ).catch((err) => {
      void logger.warn("featureFlag.global.lookup.failed", {
        key,
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    }),
  ]);
  const row = orgRow ?? globalRow;
  if (!row) return null;
  return { enabled: row.isEnabled, ...parseRules(row.rules) };
}

/**
 * True iff the flag is enabled for this org. `fallback` is returned
 * when neither a tenant nor global row exists. Cached 60s per (orgId,
 * key); use invalidateFeatureFlagCache after admin writes.
 */
export async function isFeatureEnabled(
  orgId: string,
  key: string,
  fallback = false,
): Promise<boolean> {
  const state = await unstable_cache(
    () => loadRaw(orgId, key),
    [`ff`, orgId, key],
    { tags: [tags.featureFlags(orgId), tags.featureFlags(null)], revalidate: 60 },
  )();
  if (!state) return fallback;
  return state.enabled;
}

/**
 * Enabled *and* the subject falls within the rollout percentage.
 * Subject is whatever stable id you want to key on (userId, sessionId,
 * donorEmail hash, …). Deterministic: same subject → same answer.
 */
export async function isFeatureEnabledForSubject(
  orgId: string,
  key: string,
  subjectId: string,
  fallback = false,
): Promise<boolean> {
  const state = await unstable_cache(
    () => loadRaw(orgId, key),
    [`ff`, orgId, key],
    { tags: [tags.featureFlags(orgId), tags.featureFlags(null)], revalidate: 60 },
  )();
  if (!state) return fallback;
  if (!state.enabled) return false;
  if (state.rolloutPct === undefined || state.rolloutPct >= 100) return true;
  if (state.rolloutPct <= 0) return false;
  const bucket = hash32(`${orgId}:${key}:${subjectId}`) % 100;
  return bucket < state.rolloutPct;
}

/** FNV-1a 32-bit — deterministic, dependency-free. */
function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Drop cached reads after a flag write. */
export function invalidateFeatureFlagCache(orgId: string | null) {
  revalidateTag(tags.featureFlags(orgId));
}
