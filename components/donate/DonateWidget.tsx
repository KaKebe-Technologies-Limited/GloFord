"use client";

import { useState, useTransition } from "react";
import { createDonationIntentAction } from "@/lib/actions/donations";
import { defaultPresets, formatMoney } from "@/lib/utils/money";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

/**
 * Public donation widget.
 *
 * Flow for Stripe:
 *   1. User picks amount + frequency + fills email/name.
 *   2. Server Action creates a Stripe Checkout Session and a PENDING
 *      Donation row.
 *   3. Widget redirects the browser to session.url.
 *   4. Donor returns to /donate/success; the webhook flips the
 *      Donation to SUCCEEDED in parallel.
 */

type Campaign = { slug: string; title: string; currency: string };

export function DonateWidget({ campaign }: { campaign?: Campaign }) {
  const currency = campaign?.currency ?? "USD";
  const presets = defaultPresets(currency);

  const [amountCents, setAmountCents] = useState<number>(presets[1] ?? 5000);
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const pickPreset = (cents: number) => {
    setCustomOpen(false);
    setCustom("");
    setAmountCents(cents);
  };

  const pickCustom = () => {
    setCustomOpen(true);
    const parsed = Math.round(Number(custom) * 100);
    if (Number.isFinite(parsed) && parsed > 0) setAmountCents(parsed);
  };

  const submit = () => {
    setError(null);
    if (!email) {
      setError("Email is required");
      return;
    }
    if (!amountCents || amountCents < 100) {
      setError("Enter an amount of at least 1.00");
      return;
    }
    start(async () => {
      try {
        const result = await createDonationIntentAction({
          provider: "STRIPE",
          amountCents,
          currency,
          campaignSlug: campaign?.slug,
          donorEmail: email,
          donorName: name || undefined,
          recurring,
        });
        if (result.redirectUrl) {
          window.location.href = result.redirectUrl;
          return;
        }
        // If a provider returns only a clientSecret, the advanced in-context
        // flow is deferred. Stripe Checkout always returns redirectUrl.
        setError("This provider flow is not yet implemented.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to start donation");
      }
    });
  };

  return (
    <div className="rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Make a donation</h2>
      {campaign ? (
        <p className="mt-1 text-sm text-[--color-muted-fg]">
          Supporting <strong className="font-medium text-[--color-fg]">{campaign.title}</strong>
        </p>
      ) : null}

      <div className="mt-5 flex gap-1 rounded-[--radius-md] bg-[--color-muted] p-1 text-sm">
        {(["ONE_TIME", "MONTHLY"] as const).map((kind) => {
          const selected = (kind === "MONTHLY") === recurring;
          return (
            <button
              key={kind}
              type="button"
              onClick={() => setRecurring(kind === "MONTHLY")}
              className={cn(
                "flex-1 rounded-[--radius-sm] px-3 py-1.5 font-medium transition",
                selected ? "bg-[--color-bg] shadow-sm" : "text-[--color-muted-fg]",
              )}
            >
              {kind === "ONE_TIME" ? "One-time" : "Monthly"}
            </button>
          );
        })}
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium">Amount</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {presets.map((cents) => {
            const selected = !customOpen && amountCents === cents;
            return (
              <button
                key={cents}
                type="button"
                onClick={() => pickPreset(cents)}
                className={cn(
                  "rounded-[--radius-md] border px-3 py-2 text-sm font-medium transition",
                  selected
                    ? "border-[--color-primary] bg-[--color-primary] text-[--color-primary-fg]"
                    : "border-[--color-border] hover:bg-[--color-muted]",
                )}
              >
                {formatMoney(cents, currency)}
              </button>
            );
          })}
        </div>
        <div className="mt-2">
          <label className={cn("flex items-center gap-2 rounded-[--radius-md] border px-3 py-2 text-sm",
            customOpen ? "border-[--color-primary]" : "border-[--color-border]",
          )}>
            <span className="text-[--color-muted-fg]">{currency}</span>
            <input
              type="number"
              min={1}
              step="1"
              value={custom}
              onFocus={() => setCustomOpen(true)}
              onChange={(e) => {
                setCustom(e.target.value);
                const cents = Math.round(Number(e.target.value) * 100);
                if (Number.isFinite(cents) && cents > 0) setAmountCents(cents);
              }}
              placeholder="Other amount"
              className="flex-1 bg-transparent focus:outline-none"
            />
            <button
              type="button"
              onClick={pickCustom}
              className="text-xs font-medium text-[--color-muted-fg] hover:text-[--color-fg]"
            >
              Use custom
            </button>
          </label>
        </div>
      </fieldset>

      <div className="mt-5 space-y-3">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-[--radius-md] border border-[--color-input] bg-[--color-bg] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-ring]"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Name (optional)</span>
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-[--radius-md] border border-[--color-input] bg-[--color-bg] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-ring]"
          />
        </label>
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-[--radius-sm] bg-[--color-danger]/10 p-2 text-sm text-[--color-danger]">
          {error}
        </p>
      ) : null}

      <Button onClick={submit} disabled={pending} className="mt-5 w-full" size="lg">
        {pending ? "Redirecting\u2026" : `Donate ${formatMoney(amountCents, currency)}${recurring ? " / month" : ""}`}
      </Button>

      <p className="mt-4 text-center text-xs text-[--color-muted-fg]">
        Secure payment processed by Stripe.
      </p>
    </div>
  );
}
