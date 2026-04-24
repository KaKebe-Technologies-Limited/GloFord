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
  return mode === "live" ? "https://openapiuat.airtel.africa" : "https://openapiuat.airtel.africa";
}

async function getToken() {
  const cfg = await loadConfig("AIRTEL_MONEY");
  const base = baseUrl(cfg.mode);
  const res = await fetch(`${base}/auth/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: cfg.secrets.clientId,
      client_secret: cfg.secrets.clientSecret,
      grant_type: "client_credentials",
    }),
  });
  if (!res.ok) throw new UpstreamError(`Airtel Money auth failed: ${res.status}`);
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new UpstreamError("Airtel Money token missing");
  return { token: json.access_token, cfg, base };
}

function normalizePhone(input: string): string {
  return input.replace(/[^\d]/g, "");
}

export const airtelMoneyAdapter: PaymentProviderAdapter = {
  id: "AIRTEL_MONEY",
  label: "Airtel Money",
  flow: "AWAIT_PHONE",

  async createIntent(params: CreateIntentParams): Promise<CreateIntentResult> {
    if (!params.donorPhone) throw new ValidationError("Phone number is required for Airtel Money");
    if (params.recurring) {
      throw new ValidationError("Airtel Money recurring donations are not supported yet");
    }

    const { token, cfg, base } = await getToken();
    const phone = normalizePhone(params.donorPhone);
    const country = cfg.publicConfig.country ?? "KE";
    const currency = (cfg.publicConfig.currency ?? params.currency).toUpperCase();
    const reference = `don_${crypto.randomUUID().slice(0, 20)}`;

    const res = await fetch(`${base}/merchant/v1/payments/`, {
      method: "POST",
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
        "X-Country": country,
        "X-Currency": currency,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        reference,
        subscriber: { country, currency, msisdn: phone },
        transaction: {
          amount: Math.round(params.amountCents / 100),
          country,
          currency,
          id: reference,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new UpstreamError(`Airtel Money payment failed: ${res.status} ${text}`);
    }
    const json = (await res.json()) as {
      data?: { transaction?: { id?: string; status?: string } };
      status?: { success?: boolean; message?: string };
    };
    if (!json.status?.success || !json.data?.transaction?.id) {
      throw new UpstreamError(`Airtel Money rejected: ${json.status?.message ?? "unknown"}`);
    }
    const transactionId = json.data.transaction.id;

    const { donation } = await db.$transaction(async (tx) => {
      const donor = await tx.donor.upsert({
        where: { email: params.donorEmail },
        update: { name: params.donorName ?? undefined, phone },
        create: { email: params.donorEmail, name: params.donorName, phone },
      });
      const donation = await tx.donation.create({
        data: {
          donorId: donor.id,
          campaignId: params.campaignId,
          amountCents: params.amountCents,
          currency,
          provider: "AIRTEL_MONEY",
          providerRef: transactionId,
          type: "ONE_TIME",
          status: "PENDING",
          metadata: { reference, phone, country } as never,
        },
      });
      return { donation };
    });

    return {
      kind: "AWAIT_PHONE",
      donationId: donation.id,
      providerRef: transactionId,
      phone,
    };
  },

  async verifyWebhook(req: Request, rawBody: string): Promise<WebhookVerifyResult> {
    const secretHeader = req.headers.get("x-callback-secret");
    const expected = process.env.AIRTEL_MONEY_CALLBACK_SECRET;
    if (expected && secretHeader !== expected) {
      throw new ValidationError("Airtel Money callback secret mismatch");
    }
    const event = JSON.parse(rawBody) as {
      transaction?: { id?: string; status_code?: string; message?: string };
    };
    const ref = event.transaction?.id;
    if (!ref) throw new ValidationError("Airtel Money callback missing transaction id");
    return {
      eventId: ref,
      type: event.transaction?.status_code ?? "STATUS_UPDATE",
      event,
    };
  },

  interpretEvent(raw) {
    const event = raw as { transaction?: { id?: string; status_code?: string } };
    const ref = event.transaction?.id;
    if (!ref) return null;
    const code = event.transaction?.status_code;
    if (code === "TS") return { providerRef: ref, status: "SUCCEEDED", completedAt: new Date() };
    if (code === "TF" || code === "TX") return { providerRef: ref, status: "FAILED" };
    return null;
  },
};

export async function airtelMoneyGetStatus(transactionId: string) {
  const { token, cfg, base } = await getToken();
  const country = cfg.publicConfig.country ?? "KE";
  const currency = cfg.publicConfig.currency ?? "KES";
  const res = await fetch(
    `${base}/standard/v1/payments/${encodeURIComponent(transactionId)}`,
    {
      headers: {
        Accept: "*/*",
        "X-Country": country,
        "X-Currency": currency,
        Authorization: `Bearer ${token}`,
      },
    },
  );
  if (!res.ok) throw new UpstreamError(`Airtel Money status failed: ${res.status}`);
  return (await res.json()) as {
    data?: { transaction?: { status?: string; id?: string } };
  };
}
