import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireActorFromSession } from "@/lib/auth-context";
import { runAsTenant } from "@/lib/tenant/context";
import { PaymentConfigForm } from "./Form";

const SLUG_TO_PROVIDER = {
  stripe: "STRIPE",
  pesapal: "PESAPAL",
  flutterwave: "FLUTTERWAVE",
  "mtn-momo": "MTN_MOMO",
  "airtel-money": "AIRTEL_MONEY",
} as const;

type Slug = keyof typeof SLUG_TO_PROVIDER;

export default async function ProviderConfigPage({
  params,
}: {
  params: Promise<{ provider: string }>;
}) {
  const { provider: slug } = await params;
  const mapped = SLUG_TO_PROVIDER[slug as Slug];
  if (!mapped) notFound();

  const actor = await requireActorFromSession();
  const existing = await runAsTenant(actor.orgId, (tx) =>
    tx.paymentConfiguration.findUnique({
      where: { organizationId_provider: { organizationId: actor.orgId, provider: mapped } },
      select: {
        provider: true,
        isEnabled: true,
        mode: true,
        publicConfig: true,
        updatedAt: true,
      },
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/settings/payments"
          className="inline-flex items-center gap-1 text-sm text-[--color-muted-fg] hover:text-[--color-fg]"
        >
          <ChevronLeft className="h-4 w-4" /> Back to providers
        </Link>
      </div>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{LABELS[mapped]}</h1>
        <p className="text-sm text-[--color-muted-fg]">
          {existing
            ? `Last updated ${new Date(existing.updatedAt).toLocaleDateString()}`
            : "Not yet configured. Paste keys to enable."}
        </p>
      </header>
      <div className="max-w-xl rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] p-5">
        <p className="rounded-[--radius-sm] bg-[--color-accent]/10 p-3 text-xs text-[--color-accent-fg]">
          Keys are encrypted at rest. For security, the current secret values are not re-shown;
          re-enter them to save. Leaving this form will not expose them.
        </p>
        <div className="mt-4">
          <PaymentConfigForm
            provider={mapped}
            initial={{
              isEnabled: existing?.isEnabled ?? false,
              mode: existing?.mode ?? "sandbox",
              publicConfig: (existing?.publicConfig ?? {}) as Record<string, string | undefined>,
            }}
          />
        </div>
      </div>
    </div>
  );
}

const LABELS: Record<string, string> = {
  STRIPE: "Stripe",
  PESAPAL: "Pesapal",
  FLUTTERWAVE: "Flutterwave",
  MTN_MOMO: "MTN Mobile Money",
  AIRTEL_MONEY: "Airtel Money",
};
