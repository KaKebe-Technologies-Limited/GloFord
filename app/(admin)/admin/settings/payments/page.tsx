import Link from "next/link";
import { ChevronRight, CircleDot, Circle } from "lucide-react";
import { requireActorFromSession } from "@/lib/auth-context";
import { listConfigs } from "@/lib/services/payments/config";
import { ALL_PROVIDERS } from "@/lib/services/payments/registry";
import { ToggleProviderButton } from "./ToggleProviderButton";

export const metadata = { title: "Payment providers" };

export default async function PaymentsSettingsPage() {
  const actor = await requireActorFromSession();
  const existing = await listConfigs(actor.orgId);
  const byId = new Map(existing.map((c) => [c.provider, c]));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Payment providers</h1>
        <p className="text-sm text-[--color-muted-fg]">
          Configure API keys for each provider. Enabled providers appear as options on the public
          donate page.
        </p>
      </header>

      <div className="overflow-hidden rounded-[--radius-lg] border border-[--color-border] bg-[--color-card]">
        <ul className="divide-y divide-[--color-border]">
          {ALL_PROVIDERS.map((p) => {
            const cfg = byId.get(p.id);
            const configured = !!cfg;
            const enabled = cfg?.isEnabled ?? false;
            return (
              <li key={p.id} className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5 sm:py-4">
                <div className="flex items-center gap-3">
                  {enabled ? (
                    <CircleDot className="h-4 w-4 text-[--color-success]" aria-label="Enabled" />
                  ) : (
                    <Circle className="h-4 w-4 text-[--color-muted-fg]" aria-label="Disabled" />
                  )}
                  <div>
                    <p className="font-medium">{p.label}</p>
                    <p className="text-xs text-[--color-muted-fg]">
                      {p.flow === "AWAIT_PHONE" ? "Phone-authorized" : "Redirect checkout"}
                      {cfg ? ` \u00b7 ${cfg.mode}` : " \u00b7 not configured"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {configured ? (
                    <ToggleProviderButton provider={p.id} isEnabled={enabled} />
                  ) : null}
                  <Link
                    href={`/admin/settings/payments/${p.id.toLowerCase().replace(/_/g, "-")}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-[--color-primary] hover:underline"
                  >
                    Configure <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="text-xs text-[--color-muted-fg]">
        Secrets are encrypted at rest with AES-256-GCM using the <code>ENCRYPTION_KEY</code> environment
        variable.
      </p>
    </div>
  );
}
