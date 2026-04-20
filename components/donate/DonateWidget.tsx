"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Loader2, Smartphone, CheckCircle2, XCircle } from "lucide-react";
import { createDonationIntentAction } from "@/lib/actions/donations";
import { defaultPresets, formatMoney } from "@/lib/utils/money";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

/**
 * Universal donate widget.
 *
 * The same UI powers every provider. At submit time:
 *   • REDIRECT providers (Stripe, Pesapal, Flutterwave) ->
 *     window.location = redirectUrl.
 *   • AWAIT_PHONE providers (MTN MoMo, Airtel Money) -> open the
 *     phone-waiting modal and poll /api/donations/{id}/status every
 *     3s until SUCCEEDED|FAILED, with a 3-minute timeout.
 *
 * Provider visibility is controlled by the admin at
 * /admin/settings/payments. This widget only shows providers the
 * server reports as enabled + configured.
 */

type Campaign = { slug: string; title: string; currency: string };

export type WidgetProvider = {
  id: "STRIPE" | "PESAPAL" | "FLUTTERWAVE" | "MTN_MOMO" | "AIRTEL_MONEY";
  label: string;
  flow: "REDIRECT" | "AWAIT_PHONE";
};

export function DonateWidget({
  providers,
  campaign,
}: {
  providers: WidgetProvider[];
  campaign?: Campaign;
}) {
  const currency = campaign?.currency ?? "USD";
  const presets = defaultPresets(currency);
  const defaultProvider = providers[0]?.id;

  const [amountCents, setAmountCents] = useState<number>(presets[1] ?? 5000);
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [provider, setProvider] = useState<WidgetProvider["id"] | undefined>(defaultProvider);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [awaitingDonation, setAwaitingDonation] = useState<{ id: string; phone: string } | null>(null);

  const selected = providers.find((p) => p.id === provider);

  if (!providers.length) {
    return (
      <div className="rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Donations not available</h2>
        <p className="mt-2 text-sm text-[--color-muted-fg]">
          An administrator needs to enable at least one payment provider at{" "}
          <code className="rounded bg-[--color-muted] px-1.5 py-0.5 text-xs">
            /admin/settings/payments
          </code>
          .
        </p>
      </div>
    );
  }

  const pickPreset = (cents: number) => {
    setCustomOpen(false);
    setCustom("");
    setAmountCents(cents);
  };

  const submit = () => {
    setError(null);
    if (!provider) return setError("Pick a payment method");
    if (!email) return setError("Email is required");
    if (!amountCents || amountCents < 100) return setError("Enter an amount of at least 1.00");
    if (selected?.flow === "AWAIT_PHONE" && !phone) {
      return setError("Phone number is required for mobile money");
    }
    if (recurring && provider !== "STRIPE") {
      return setError("Recurring donations are currently only supported via Stripe");
    }
    start(async () => {
      try {
        const result = await createDonationIntentAction({
          provider,
          amountCents,
          currency,
          campaignSlug: campaign?.slug,
          donorEmail: email,
          donorName: name || undefined,
          donorPhone: phone || undefined,
          recurring,
        });
        if (result.kind === "REDIRECT" && result.redirectUrl) {
          window.location.href = result.redirectUrl;
          return;
        }
        if (result.kind === "AWAIT_PHONE") {
          setAwaitingDonation({ id: result.donationId, phone: result.phone });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to start donation");
      }
    });
  };

  return (
    <>
      <div className="rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Make a donation</h2>
        {campaign ? (
          <p className="mt-1 text-sm text-[--color-muted-fg]">
            Supporting <strong className="font-medium text-[--color-fg]">{campaign.title}</strong>
          </p>
        ) : null}

        <div className="mt-5 flex gap-1 rounded-[--radius-md] bg-[--color-muted] p-1 text-sm">
          {(["ONE_TIME", "MONTHLY"] as const).map((kind) => {
            const isRecurring = kind === "MONTHLY";
            const active = isRecurring === recurring;
            return (
              <button
                key={kind}
                type="button"
                onClick={() => setRecurring(isRecurring)}
                className={cn(
                  "flex-1 rounded-[--radius-sm] px-3 py-1.5 font-medium transition",
                  active ? "bg-[--color-bg] shadow-sm" : "text-[--color-muted-fg]",
                )}
              >
                {isRecurring ? "Monthly" : "One-time"}
              </button>
            );
          })}
        </div>

        <fieldset className="mt-5">
          <legend className="text-sm font-medium">Amount</legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {presets.map((cents) => {
              const active = !customOpen && amountCents === cents;
              return (
                <button
                  key={cents}
                  type="button"
                  onClick={() => pickPreset(cents)}
                  className={cn(
                    "rounded-[--radius-md] border px-3 py-2 text-sm font-medium transition",
                    active
                      ? "border-[--color-primary] bg-[--color-primary] text-[--color-primary-fg]"
                      : "border-[--color-border] hover:bg-[--color-muted]",
                  )}
                >
                  {formatMoney(cents, currency)}
                </button>
              );
            })}
          </div>
          <label
            className={cn(
              "mt-2 flex items-center gap-2 rounded-[--radius-md] border px-3 py-2 text-sm",
              customOpen ? "border-[--color-primary]" : "border-[--color-border]",
            )}
          >
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
          </label>
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
              className={inputCls}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Name (optional)</span>
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </label>
          {selected?.flow === "AWAIT_PHONE" ? (
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Mobile number</span>
              <input
                type="tel"
                autoComplete="tel"
                placeholder="+2547\u2026"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputCls}
              />
              <span className="block text-xs text-[--color-muted-fg]">
                Include country code. You\u2019ll get a prompt to approve on this phone.
              </span>
            </label>
          ) : null}
        </div>

        <fieldset className="mt-5">
          <legend className="text-sm font-medium">Pay with</legend>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {providers.map((p) => {
              const active = p.id === provider;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProvider(p.id)}
                  className={cn(
                    "flex items-center justify-between rounded-[--radius-md] border px-3 py-2 text-sm font-medium transition",
                    active
                      ? "border-[--color-primary] bg-[--color-primary]/5"
                      : "border-[--color-border] hover:bg-[--color-muted]",
                  )}
                >
                  <span>{p.label}</span>
                  {p.flow === "AWAIT_PHONE" ? (
                    <Smartphone className="h-4 w-4 text-[--color-muted-fg]" aria-hidden="true" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </fieldset>

        {error ? (
          <p role="alert" className="mt-4 rounded-[--radius-sm] bg-[--color-danger]/10 p-2 text-sm text-[--color-danger]">
            {error}
          </p>
        ) : null}

        <Button onClick={submit} disabled={pending} className="mt-5 w-full" size="lg">
          {pending
            ? "Starting\u2026"
            : `Donate ${formatMoney(amountCents, currency)}${recurring ? " / month" : ""}`}
        </Button>

        <p className="mt-4 text-center text-xs text-[--color-muted-fg]">
          Secure payment processed by {selected?.label ?? "your chosen provider"}.
        </p>
      </div>

      {awaitingDonation ? (
        <PhoneWaitModal
          donationId={awaitingDonation.id}
          phone={awaitingDonation.phone}
          onClose={() => setAwaitingDonation(null)}
        />
      ) : null}
    </>
  );
}

function PhoneWaitModal({
  donationId,
  phone,
  onClose,
}: {
  donationId: string;
  phone: string;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<"PENDING" | "SUCCEEDED" | "FAILED">("PENDING");
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (status !== "PENDING") return;
    let active = true;
    const poll = async () => {
      if (Date.now() - startedAt.current > 180_000) {
        if (active) setStatus("FAILED");
        return;
      }
      try {
        const res = await fetch(`/api/donations/${donationId}/status`, { cache: "no-store" });
        if (!res.ok) throw new Error("network");
        const json = (await res.json()) as { status: "PENDING" | "SUCCEEDED" | "FAILED" };
        if (!active) return;
        if (json.status !== "PENDING") setStatus(json.status);
      } catch {
        /* keep polling */
      }
    };
    const interval = setInterval(poll, 3000);
    void poll();
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [donationId, status]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="donate-wait-title"
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
    >
      <div className="w-full max-w-md rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] p-6 shadow-xl">
        {status === "PENDING" ? (
          <>
            <div className="grid place-items-center">
              <Loader2 className="h-10 w-10 animate-spin text-[--color-primary]" aria-hidden="true" />
            </div>
            <h2 id="donate-wait-title" className="mt-4 text-center text-lg font-semibold">
              Check your phone
            </h2>
            <p className="mt-2 text-center text-sm text-[--color-muted-fg]">
              We\u2019ve sent a payment request to <strong>{phone}</strong>. Enter your PIN to confirm.
              This can take up to a minute.
            </p>
          </>
        ) : status === "SUCCEEDED" ? (
          <>
            <div className="grid place-items-center">
              <CheckCircle2 className="h-10 w-10 text-[--color-success]" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-center text-lg font-semibold">Thank you!</h2>
            <p className="mt-2 text-center text-sm text-[--color-muted-fg]">
              Your donation was received. A receipt is on the way.
            </p>
            <Button onClick={onClose} className="mt-6 w-full">
              Close
            </Button>
          </>
        ) : (
          <>
            <div className="grid place-items-center">
              <XCircle className="h-10 w-10 text-[--color-danger]" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-center text-lg font-semibold">Payment not completed</h2>
            <p className="mt-2 text-center text-sm text-[--color-muted-fg]">
              Either the request timed out or your provider reported a failure. No charge was made.
            </p>
            <Button onClick={onClose} variant="outline" className="mt-6 w-full">
              Try again
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-[--radius-md] border border-[--color-input] bg-[--color-bg] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-ring]";
