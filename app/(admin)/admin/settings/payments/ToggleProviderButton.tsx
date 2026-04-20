"use client";

import { useTransition } from "react";
import { togglePaymentProviderAction } from "@/lib/actions/paymentConfig";
import type { PaymentProvider } from "@prisma/client";

export function ToggleProviderButton({
  provider,
  isEnabled,
}: {
  provider: PaymentProvider;
  isEnabled: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isEnabled}
      aria-label={isEnabled ? "Disable provider" : "Enable provider"}
      disabled={pending}
      onClick={() =>
        start(async () => {
          try {
            await togglePaymentProviderAction({ provider, isEnabled: !isEnabled });
          } catch (e) {
            alert(e instanceof Error ? e.message : "Failed to toggle");
          }
        })
      }
      className={`inline-flex h-6 w-11 items-center rounded-full transition ${
        isEnabled ? "bg-[--color-primary]" : "bg-[--color-muted]"
      } ${pending ? "opacity-50" : ""}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-[--color-bg] shadow transition ${
          isEnabled ? "translate-x-5" : "translate-x-0.5"
        }`}
        aria-hidden="true"
      />
    </button>
  );
}
