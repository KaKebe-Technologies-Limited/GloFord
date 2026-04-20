"use client";

import { useState, useTransition } from "react";
import { savePaymentConfigAction } from "@/lib/actions/paymentConfig";
import { Button } from "@/components/ui/Button";

type ProviderId = "STRIPE" | "PESAPAL" | "FLUTTERWAVE" | "MTN_MOMO" | "AIRTEL_MONEY";

type Initial = {
  isEnabled: boolean;
  mode: string;
  publicConfig: Record<string, string | undefined>;
};

export function PaymentConfigForm({
  provider,
  initial,
}: {
  provider: ProviderId;
  initial: Initial;
}) {
  const [isEnabled, setIsEnabled] = useState(initial.isEnabled);
  const [mode, setMode] = useState<"sandbox" | "live">(
    (initial.mode as "sandbox" | "live") ?? "sandbox",
  );
  const [fields, setFields] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(initial.publicConfig)) if (v) out[k] = v;
    return out;
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const setField = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((f) => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    setError(null);
    start(async () => {
      try {
        await savePaymentConfigAction({
          provider,
          isEnabled,
          mode,
          ...fields,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
          />
          Enable this provider
        </label>
        <label className="flex items-center gap-2 text-sm">
          Mode
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "sandbox" | "live")}
            className="rounded-[--radius-md] border border-[--color-border] bg-[--color-bg] px-2 py-1 text-sm"
          >
            <option value="sandbox">Sandbox</option>
            <option value="live">Live</option>
          </select>
        </label>
      </div>

      <div className="space-y-3">{renderFields(provider, fields, setField)}</div>

      {error ? (
        <p role="alert" className="rounded-[--radius-sm] bg-[--color-danger]/10 p-2 text-sm text-[--color-danger]">
          {error}
        </p>
      ) : null}

      <Button onClick={submit} disabled={pending} className="w-full">
        {pending ? "Saving\u2026" : "Save configuration"}
      </Button>
    </div>
  );
}

function renderFields(
  provider: ProviderId,
  fields: Record<string, string>,
  setField: (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => void,
) {
  const common = (label: string, key: string, type: "text" | "password" | "url" = "password", hint?: string) => (
    <label key={key} className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {hint ? <span className="block text-xs text-[--color-muted-fg]">{hint}</span> : null}
      <input
        type={type}
        value={fields[key] ?? ""}
        onChange={setField(key)}
        autoComplete="off"
        className="w-full rounded-[--radius-md] border border-[--color-input] bg-[--color-bg] px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[--color-ring]"
      />
    </label>
  );

  switch (provider) {
    case "STRIPE":
      return [
        common("Secret key", "secretKey", "password", "Starts with sk_test_ or sk_live_"),
        common("Publishable key", "publishableKey", "text", "Starts with pk_test_ or pk_live_"),
      ];
    case "PESAPAL":
      return [
        common("Consumer key", "consumerKey", "text"),
        common("Consumer secret", "consumerSecret", "password"),
        common("Registered IPN id", "ipnId", "text", "From POST /URLSetup/RegisterIPN"),
        common("Country (ISO-2)", "country", "text"),
      ];
    case "FLUTTERWAVE":
      return [
        common("Secret key", "secretKey", "password", "FLWSECK-\u2026"),
        common("Public key", "publicKey", "text", "FLWPUBK-\u2026"),
        common("Country (ISO-2)", "country", "text"),
      ];
    case "MTN_MOMO":
      return [
        common("Subscription key", "subscriptionKey", "password", "Ocp-Apim-Subscription-Key"),
        common("API user id (UUID)", "apiUser", "text"),
        common("API key", "apiKey", "password"),
        common("Target environment", "targetEnvironment", "text", "e.g. mtnuganda, mtnrwanda"),
        common("Currency (ISO-3)", "currency", "text"),
        common("Callback host (https)", "callbackHost", "url"),
      ];
    case "AIRTEL_MONEY":
      return [
        common("Client id", "clientId", "text"),
        common("Client secret", "clientSecret", "password"),
        common("Country (ISO-2)", "country", "text"),
        common("Currency (ISO-3)", "currency", "text"),
      ];
  }
}
