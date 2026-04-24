import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { UpstreamError, ValidationError } from "@/lib/errors";
import { loadConfig } from "./config";
import type {
  CreateIntentParams,
  CreateIntentResult,
  PaymentProviderAdapter,
  WebhookVerifyResult,
} from "./types";

const BASE = "https://api.flutterwave.com/v3";

export const flutterwaveAdapter: PaymentProviderAdapter = {
  id: "FLUTTERWAVE",
  label: "Flutterwave",
  flow: "REDIRECT",

  async createIntent(params: CreateIntentParams): Promise<CreateIntentResult> {
    if (params.recurring) {
      throw new ValidationError("Flutterwave recurring donations are not supported yet");
    }
    const cfg = await loadConfig("FLUTTERWAVE");

    const donor = await db.donor.upsert({
      where: { email: params.donorEmail },
      update: { name: params.donorName ?? undefined },
      create: { email: params.donorEmail, name: params.donorName },
    });

    const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const tx_ref = `don_${crypto.randomUUID()}`;

    const res = await fetch(`${BASE}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.secrets.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref,
        amount: (params.amountCents / 100).toFixed(2),
        currency: params.currency.toUpperCase(),
        redirect_url: `${origin}/donate/success?provider=flutterwave&tx_ref=${tx_ref}`,
        customer: {
          email: params.donorEmail,
          name: params.donorName ?? params.donorEmail,
          phonenumber: params.donorPhone,
        },
        customizations: {
          title: params.campaignId ? "Donation (campaign)" : "Donation",
        },
        meta: { donorId: donor.id, campaignId: params.campaignId ?? "" },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new UpstreamError(`Flutterwave payment init failed: ${res.status} ${body}`);
    }
    const json = (await res.json()) as {
      status?: string;
      message?: string;
      data?: { link?: string };
    };
    if (json.status !== "success" || !json.data?.link) {
      throw new UpstreamError(`Flutterwave rejected: ${json.message ?? "unknown"}`);
    }

    const donation = await db.donation.create({
      data: {
        donorId: donor.id,
        campaignId: params.campaignId,
        amountCents: params.amountCents,
        currency: params.currency.toUpperCase(),
        provider: "FLUTTERWAVE",
        providerRef: tx_ref,
        type: "ONE_TIME",
        status: "PENDING",
      },
    });

    return {
      kind: "REDIRECT",
      donationId: donation.id,
      providerRef: tx_ref,
      redirectUrl: json.data.link,
    };
  },

  async verifyWebhook(req: Request, rawBody: string): Promise<WebhookVerifyResult> {
    const hash = req.headers.get("verif-hash");
    const expected = process.env.FLUTTERWAVE_WEBHOOK_HASH;
    if (!hash || !expected) throw new ValidationError("Missing Flutterwave webhook hash");
    const a = Buffer.from(hash);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new ValidationError("Invalid Flutterwave webhook hash");
    }
    const event = JSON.parse(rawBody) as {
      event?: string;
      data?: { tx_ref?: string; status?: string; id?: number | string };
    };
    const ref = event.data?.tx_ref ?? String(event.data?.id ?? "");
    if (!ref) throw new ValidationError("Flutterwave webhook missing tx_ref");
    return { eventId: ref, type: event.event ?? "charge", event };
  },

  interpretEvent(raw) {
    const event = raw as { data?: { tx_ref?: string; status?: string } };
    const ref = event.data?.tx_ref;
    if (!ref) return null;
    const s = event.data?.status?.toLowerCase();
    if (s === "successful") return { providerRef: ref, status: "SUCCEEDED", completedAt: new Date() };
    if (s === "failed" || s === "cancelled") return { providerRef: ref, status: "FAILED" };
    return null;
  },
};

export async function flutterwaveVerifyByRef(txRef: string) {
  const cfg = await loadConfig("FLUTTERWAVE");
  const res = await fetch(
    `${BASE}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`,
    { headers: { Authorization: `Bearer ${cfg.secrets.secretKey}` } },
  );
  if (!res.ok) throw new UpstreamError(`Flutterwave verify failed: ${res.status}`);
  return (await res.json()) as {
    status?: string;
    data?: { status?: string; amount?: number; currency?: string };
  };
}

export function flutterwaveSignature(secret: string, body: string) {
  return createHmac("sha256", secret).update(body).digest("hex");
}
