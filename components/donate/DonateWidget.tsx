"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Smartphone, CreditCard, CheckCircle2, XCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { createDonationIntentAction } from "@/lib/actions/donations";
import { defaultPresets, formatMoney } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

type Campaign = { slug: string; title: string; currency: string };

export type WidgetProvider = {
  id: "PESAPAL" | "MTN_MOMO" | "AIRTEL_MONEY";
  label: string;
  flow: "REDIRECT" | "AWAIT_PHONE";
};

const inputCls =
  "w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm transition focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--token-primary)/0.20)]";

export function DonateWidget({
  providers,
  campaign,
}: {
  providers: WidgetProvider[];
  campaign?: Campaign;
}) {
  const t = useTranslations("public.donate");
  const currency = campaign?.currency ?? "USD";
  const presets = defaultPresets(currency);
  const defaultProvider = providers[0]?.id;

  const STEPS = [t("steps.amount"), t("steps.details"), t("steps.payment"), t("steps.confirm")];

  const [step, setStep] = useState(0);
  const [amountCents, setAmountCents] = useState<number>(presets[1] ?? 5000);
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState("");
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
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-bold text-[var(--color-fg)]">{t("notAvailableTitle")}</h2>
        <p className="mt-2 text-sm text-[var(--color-muted-fg)]">{t("notAvailableDesc")}</p>
      </div>
    );
  }

  const pickPreset = (cents: number) => {
    setCustomOpen(false);
    setCustom("");
    setAmountCents(cents);
  };

  const canNext = () => {
    if (step === 0) return amountCents >= 100;
    if (step === 1) return !!email;
    if (step === 2) return !!provider;
    return true;
  };

  const next = () => {
    setError(null);
    if (step === 1 && !email) { setError(t("errorEmail")); return; }
    if (step === 2 && !provider) { setError(t("errorProvider")); return; }
    if (step === 2 && selected?.flow === "AWAIT_PHONE" && !phone) {
      setError(t("errorPhone")); return;
    }
    if (step < 3) setStep(step + 1);
  };

  const submit = () => {
    setError(null);
    start(async () => {
      try {
        const result = await createDonationIntentAction({
          provider: provider!,
          amountCents,
          currency,
          campaignSlug: campaign?.slug,
          donorEmail: email,
          donorName: name || undefined,
          donorPhone: phone || undefined,
          recurring: false,
        });
        if (result.kind === "REDIRECT" && result.redirectUrl) {
          window.location.href = result.redirectUrl;
          return;
        }
        if (result.kind === "AWAIT_PHONE") {
          setAwaitingDonation({ id: result.donationId, phone: result.phone });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : t("errorGeneric"));
      }
    });
  };

  return (
    <>
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-bold text-[var(--color-fg)]">{t("title")}</h2>
        {campaign && (
          <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
            {t("supporting", { campaign: campaign.title })}
          </p>
        )}

        {/* Step indicator */}
        <div className="mt-6 flex items-center gap-1">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition",
                i <= step
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-muted)] text-[var(--color-muted-fg)]",
              )}>
                {i < step ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  "mx-1 h-0.5 flex-1 rounded transition",
                  i < step ? "bg-[var(--color-primary)]" : "bg-[var(--color-muted)]",
                )} />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex">
          {STEPS.map((label, i) => (
            <span key={label} className={cn(
              "flex-1 text-center text-[10px] font-medium",
              i <= step ? "text-[var(--color-primary)]" : "text-[var(--color-muted-fg)]",
            )}>
              {label}
            </span>
          ))}
        </div>

        <div className="mt-6">
          {/* Step 0: Amount */}
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-[var(--color-fg)]">{t("selectAmount")}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {presets.map((cents) => {
                  const active = !customOpen && amountCents === cents;
                  return (
                    <button key={cents} type="button" onClick={() => pickPreset(cents)}
                      className={cn(
                        "rounded-xl border px-3 py-3 text-sm font-semibold transition",
                        active
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-md"
                          : "border-[var(--color-border)] bg-white text-[var(--color-fg)] hover:border-[rgb(var(--token-primary)/0.50)]",
                      )}>
                      {formatMoney(cents, currency)}
                    </button>
                  );
                })}
              </div>
              <div className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-3",
                customOpen ? "border-[var(--color-primary)] ring-2 ring-[rgb(var(--token-primary)/0.20)]" : "border-[var(--color-border)]",
              )}>
                <span className="text-sm font-medium text-[var(--color-muted-fg)]">{currency}</span>
                <input type="number" min={1} step="1" value={custom}
                  onFocus={() => setCustomOpen(true)}
                  onChange={(e) => {
                    setCustom(e.target.value);
                    const cents = Math.round(Number(e.target.value) * 100);
                    if (Number.isFinite(cents) && cents > 0) setAmountCents(cents);
                  }}
                  placeholder={t("customAmount")}
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-[var(--color-fg)]">{t("yourInformation")}</p>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">{t("emailLabel")}</label>
                <input type="email" required autoComplete="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder={t("emailPlaceholder")} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">{t("nameLabel")}</label>
                <input type="text" autoComplete="name" value={name}
                  onChange={(e) => setName(e.target.value)} className={inputCls} placeholder={t("namePlaceholder")} />
              </div>
            </div>
          )}

          {/* Step 2: Payment method */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-[var(--color-fg)]">{t("choosePayment")}</p>
              <div className="space-y-2">
                {providers.map((p) => {
                  const active = p.id === provider;
                  const Icon = p.flow === "AWAIT_PHONE" ? Smartphone : CreditCard;
                  return (
                    <button key={p.id} type="button" onClick={() => setProvider(p.id)}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-xl border p-4 text-left transition",
                        active
                          ? "border-[var(--color-primary)] bg-[rgb(var(--token-primary)/0.5)] shadow-sm"
                          : "border-[var(--color-border)] bg-white hover:border-[rgb(var(--token-primary)/0.30)]",
                      )}>
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        active ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-muted)] text-[var(--color-muted-fg)]",
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold text-[var(--color-fg)]">{p.label}</span>
                        <p className="text-xs text-[var(--color-muted-fg)]">
                          {p.flow === "AWAIT_PHONE" ? t("mobileMoneyDesc") : t("onlinePaymentDesc")}
                        </p>
                      </div>
                      <div className={cn(
                        "h-5 w-5 rounded-full border-2",
                        active ? "border-[var(--color-primary)] bg-[var(--color-primary)]" : "border-[var(--color-border)]",
                      )}>
                        {active && <div className="m-0.5 h-3 w-3 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              {selected?.flow === "AWAIT_PHONE" && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">{t("mobileNumberLabel")}</label>
                  <input type="tel" autoComplete="tel" placeholder={t("mobileNumberPlaceholder")}
                    value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
                  <p className="mt-1 text-xs text-[var(--color-muted-fg)]">{t("mobileNumberHint")}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-[var(--color-fg)]">{t("confirmTitle")}</p>
              <div className="rounded-xl border border-[var(--color-border)] bg-[rgb(248_250_249)] p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-muted-fg)]">{t("amountLabel")}</span>
                  <span className="font-bold text-[var(--color-fg)] text-lg">{formatMoney(amountCents, currency)}</span>
                </div>
                <div className="border-t border-[var(--color-border)]" />
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-muted-fg)]">{t("emailConfirmLabel")}</span>
                  <span className="text-[var(--color-fg)]">{email}</span>
                </div>
                {name && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-muted-fg)]">{t("nameConfirmLabel")}</span>
                    <span className="text-[var(--color-fg)]">{name}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-muted-fg)]">{t("paymentLabel")}</span>
                  <span className="text-[var(--color-fg)]">{selected?.label}</span>
                </div>
                {phone && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-muted-fg)]">{t("phoneLabel")}</span>
                    <span className="text-[var(--color-fg)]">{phone}</span>
                  </div>
                )}
                {campaign && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-muted-fg)]">{t("campaignLabel")}</span>
                    <span className="text-[var(--color-fg)]">{campaign.title}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-[var(--color-danger)]">
              {error}
            </p>
          )}

          {/* Navigation */}
          <div className="mt-6 flex gap-3">
            {step > 0 && (
              <button type="button" onClick={() => { setStep(step - 1); setError(null); }}
                className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white">
                <ArrowLeft className="h-4 w-4" /> {t("back")}
              </button>
            )}
            {step < 3 ? (
              <button type="button" onClick={next} disabled={!canNext()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:shadow-lg disabled:opacity-50">
                {t("next")} <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" onClick={submit} disabled={pending}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:shadow-lg disabled:opacity-60">
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {pending ? t("processing") : t("donate", { amount: formatMoney(amountCents, currency) })}
              </button>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-[var(--color-muted-fg)]">{t("secureNote")}</p>
      </div>

      {awaitingDonation && (
        <PhoneWaitModal
          donationId={awaitingDonation.id}
          phone={awaitingDonation.phone}
          onClose={() => setAwaitingDonation(null)}
        />
      )}
    </>
  );
}

function PhoneWaitModal({ donationId, phone, onClose }: { donationId: string; phone: string; onClose: () => void }) {
  const t = useTranslations("public.donate.modal");
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
      } catch { /* keep polling */ }
    };
    const interval = setInterval(poll, 3000);
    void poll();
    return () => { active = false; clearInterval(interval); };
  }, [donationId, status]);

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-2xl">
        {status === "PENDING" && (
          <>
            <div className="flex justify-center">
              <div className="relative">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-[var(--color-muted)] border-t-[var(--color-primary)]" />
                <Smartphone className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-[var(--color-primary)]" />
              </div>
            </div>
            <h2 className="mt-6 text-center text-xl font-bold text-[var(--color-fg)]">{t("checkPhone")}</h2>
            <p className="mt-2 text-center text-sm text-[var(--color-muted-fg)]">
              {t("checkPhoneDesc", { phone })}
            </p>
          </>
        )}
        {status === "SUCCEEDED" && (
          <>
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
            </div>
            <h2 className="mt-6 text-center text-xl font-bold text-[var(--color-fg)]">{t("successTitle")}</h2>
            <p className="mt-2 text-center text-sm text-[var(--color-muted-fg)]">{t("successDesc")}</p>
            <button onClick={onClose}
              className="mt-6 w-full rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:shadow-lg">
              {t("close")}
            </button>
          </>
        )}
        {status === "FAILED" && (
          <>
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <XCircle className="h-10 w-10 text-[var(--color-danger)]" />
              </div>
            </div>
            <h2 className="mt-6 text-center text-xl font-bold text-[var(--color-fg)]">{t("failedTitle")}</h2>
            <p className="mt-2 text-center text-sm text-[var(--color-muted-fg)]">{t("failedDesc")}</p>
            <button onClick={onClose}
              className="mt-6 w-full rounded-full border-2 border-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white">
              {t("tryAgain")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
