import { db } from "@/lib/db";
import { UpstreamError, ValidationError } from "@/lib/errors";
import { loadConfig } from "./config";
import type {
  CreateIntentParams,
  CreateIntentResult,
  PaymentProviderAdapter,
  WebhookVerifyResult,
} from "./types";

function baseUrl(mode: string) {
  return mode === "live" ? "https://pay.pesapal.com/v3" : "https://cybqa.pesapal.com/pesapalv3";
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<{ token: string; base: string; cfg: Awaited<ReturnType<typeof loadConfig<"PESAPAL">>> }> {
  const cfg = await loadConfig("PESAPAL");
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return { token: cachedToken.token, base: baseUrl(cfg.mode), cfg };
  }
  const base = baseUrl(cfg.mode);
  const res = await fetch(`${base}/api/Auth/RequestToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      consumer_key: cfg.secrets.consumerKey,
      consumer_secret: cfg.secrets.consumerSecret,
    }),
  });
  if (!res.ok) throw new UpstreamError(`Pesapal auth failed: ${res.status}`);
  const json = (await res.json()) as { token?: string; expiryDate?: string };
  if (!json.token) throw new UpstreamError("Pesapal did not return a token");
  const expiresAt = json.expiryDate ? new Date(json.expiryDate).getTime() : Date.now() + 4 * 60_000;
  cachedToken = { token: json.token, expiresAt };
  return { token: json.token, base, cfg };
}

export const pesapalAdapter: PaymentProviderAdapter = {
  id: "PESAPAL",
  label: "Pesapal",
  flow: "REDIRECT",

  async createIntent(params: CreateIntentParams): Promise<CreateIntentResult> {
    if (params.recurring) throw new ValidationError("Pesapal recurring donations are not supported yet");

    const { token, base, cfg } = await getToken();
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const ipnId = cfg.publicConfig.ipnId ?? process.env.PESAPAL_IPN_ID;
    if (!ipnId) throw new UpstreamError("Pesapal IPN id not configured");

    const donor = await db.donor.upsert({
      where: { email: params.donorEmail },
      update: { name: params.donorName ?? undefined },
      create: { email: params.donorEmail, name: params.donorName },
    });

    const merchantReference = `don_${crypto.randomUUID()}`;

    const orderRes = await fetch(`${base}/api/Transactions/SubmitOrderRequest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: merchantReference,
        currency: params.currency.toUpperCase(),
        amount: params.amountCents / 100,
        description: params.campaignId ? "Donation (campaign)" : "Donation",
        callback_url: `${origin}/donate/success?provider=pesapal`,
        notification_id: ipnId,
        billing_address: {
          email_address: params.donorEmail,
          first_name: params.donorName?.split(" ")[0] ?? "",
          last_name: params.donorName?.split(" ").slice(1).join(" ") ?? "",
        },
      }),
    });

    if (!orderRes.ok) {
      const text = await orderRes.text();
      throw new UpstreamError(`Pesapal order failed: ${orderRes.status} ${text}`);
    }
    const json = (await orderRes.json()) as {
      order_tracking_id?: string;
      redirect_url?: string;
      error?: { message?: string };
    };
    if (!json.order_tracking_id || !json.redirect_url) {
      throw new UpstreamError(`Pesapal order rejected: ${json.error?.message ?? "unknown"}`);
    }
    const trackingId = json.order_tracking_id;

    const donation = await db.donation.create({
      data: {
        donorId: donor.id,
        campaignId: params.campaignId,
        amountCents: params.amountCents,
        currency: params.currency.toUpperCase(),
        provider: "PESAPAL",
        providerRef: trackingId,
        type: "ONE_TIME",
        status: "PENDING",
        metadata: { merchantReference } as never,
      },
    });

    return {
      kind: "REDIRECT",
      donationId: donation.id,
      providerRef: trackingId,
      redirectUrl: json.redirect_url,
    };
  },

  async verifyWebhook(req: Request): Promise<WebhookVerifyResult> {
    const url = new URL(req.url);
    const trackingId = url.searchParams.get("OrderTrackingId") ?? url.searchParams.get("orderTrackingId");
    const notifType =
      url.searchParams.get("OrderNotificationType") ?? url.searchParams.get("orderNotificationType");
    if (!trackingId) throw new ValidationError("Missing Pesapal OrderTrackingId");
    return {
      eventId: trackingId,
      type: notifType ?? "IPNCHANGE",
      event: { trackingId, notifType },
    };
  },

  interpretEvent() {
    return null;
  },
};

export async function pesapalGetStatus(trackingId: string) {
  const { token, base } = await getToken();
  const res = await fetch(
    `${base}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(trackingId)}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
  if (!res.ok) throw new UpstreamError(`Pesapal status failed: ${res.status}`);
  return (await res.json()) as {
    payment_status_description?: string;
    status_code?: number;
    confirmation_code?: string;
  };
}
