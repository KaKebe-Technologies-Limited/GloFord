import { runAsTenant } from "@/lib/tenant/context";
import { UpstreamError, ValidationError } from "@/lib/errors";
import { loadConfig } from "./config";
import type {
  CreateIntentParams,
  CreateIntentResult,
  PaymentProviderAdapter,
  WebhookVerifyResult,
} from "./types";

/**
 * Pesapal adapter (East Africa).
 *
 * API flow (v3):
 *   1. POST /api/Auth/RequestToken with consumer_key/consumer_secret
 *      -> { token } valid ~5 min. We cache in-memory per process.
 *   2. POST /api/Transactions/SubmitOrderRequest with order payload
 *      -> { order_tracking_id, redirect_url }.
 *   3. Donor completes on Pesapal; we receive an IPN callback.
 *   4. POST /api/Transactions/GetTransactionStatus to confirm state.
 */

function baseUrl(mode: string) {
  return mode === "live" ? "https://pay.pesapal.com/v3" : "https://cybqa.pesapal.com/pesapalv3";
}

const tokenCache = new Map<string, { token: string; expiresAt: number }>();

async function getToken(orgId: string): Promise<{ token: string; base: string; cfg: Awaited<ReturnType<typeof loadConfig<"PESAPAL">>> }> {
  const cfg = await loadConfig(orgId, "PESAPAL");
  const cached = tokenCache.get(orgId);
  if (cached && cached.expiresAt > Date.now() + 30_000) {
    return { token: cached.token, base: baseUrl(cfg.mode), cfg };
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
  const json = (await res.json()) as { token?: string; expiryDate?: string; error?: unknown };
  if (!json.token) throw new UpstreamError("Pesapal did not return a token");
  const expiresAt = json.expiryDate ? new Date(json.expiryDate).getTime() : Date.now() + 4 * 60_000;
  tokenCache.set(orgId, { token: json.token, expiresAt });
  return { token: json.token, base, cfg };
}

export const pesapalAdapter: PaymentProviderAdapter = {
  id: "PESAPAL",
  label: "Pesapal",
  flow: "REDIRECT",

  async createIntent(params: CreateIntentParams): Promise<CreateIntentResult> {
    if (params.recurring) throw new ValidationError("Pesapal recurring donations are not supported yet");

    const { token, base, cfg } = await getToken(params.orgId);
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const ipnId = cfg.publicConfig.ipnId ?? process.env.PESAPAL_IPN_ID;
    if (!ipnId) throw new UpstreamError("Pesapal IPN id not configured");

    const donor = await runAsTenant(params.orgId, (tx) =>
      tx.donor.upsert({
        where: {
          organizationId_email: { organizationId: params.orgId, email: params.donorEmail },
        },
        update: { name: params.donorName ?? undefined },
        create: {
          organizationId: params.orgId,
          email: params.donorEmail,
          name: params.donorName,
        },
      }),
    );

    const merchantReference = `gfd_${crypto.randomUUID()}`;

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

    const donation = await runAsTenant(params.orgId, (tx) =>
      tx.donation.create({
        data: {
          organizationId: params.orgId,
          donorId: donor.id,
          campaignId: params.campaignId,
          amountCents: params.amountCents,
          currency: params.currency.toUpperCase(),
          provider: "PESAPAL",
          providerRef: json.order_tracking_id!,
          type: "ONE_TIME",
          status: "PENDING",
          metadata: { merchantReference } as never,
        },
      }),
    );

    return {
      kind: "REDIRECT",
      donationId: donation.id,
      providerRef: json.order_tracking_id,
      redirectUrl: json.redirect_url,
    };
  },

  async verifyWebhook(req: Request): Promise<WebhookVerifyResult> {
    // Pesapal IPN is a GET with orderTrackingId + orderNotificationType
    // query params. It does not sign the payload; we authenticate by
    // calling GetTransactionStatus with our server credentials — if
    // the tracking id exists in our DB and Pesapal confirms it, the
    // event is legitimate.
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
    // Pesapal IPN doesn't include the final state in the callback;
    // our webhook route calls GetTransactionStatus and constructs the
    // transition there (see app/api/webhooks/pesapal/route.ts).
    return null;
  },
};

/** Exposed so the webhook route can finalize after IPN notification. */
export async function pesapalGetStatus(orgId: string, trackingId: string) {
  const { token, base } = await getToken(orgId);
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
