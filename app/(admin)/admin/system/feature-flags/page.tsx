import { requireActorFromSession } from "@/lib/auth-context";
import { listFeatureFlags } from "@/lib/services/system";
import { FeatureFlagManager } from "./FeatureFlagManager";

export const metadata = { title: "Feature flags" };

export default async function FeatureFlagsPage() {
  await requireActorFromSession();
  const rows = await listFeatureFlags();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Feature flags</h1>
        <p className="text-sm text-[var(--color-muted-fg)]">
          Toggles for optional features.
        </p>
      </header>

      <FeatureFlagManager
        flags={rows.map((f) => ({
          id: f.id,
          key: f.key,
          description: f.description ?? "",
          isEnabled: f.isEnabled,
          isGlobal: false,
        }))}
      />
    </div>
  );
}
