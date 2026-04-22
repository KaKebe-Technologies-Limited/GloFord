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
 * MTN Mobile Money (Collection API) adapter.
 *
 * Flow:
 *   1. Obtain OAuth token:
 *      POST /collection/token/
 *      Basic auth: apiUser:apiKey
 *      Header: Ocp-Apim-Subscription-Key
 *      -> { access_token }.
 *   2. Request-to-pay:
 *      POST /collection/v1_0/requesttopay
 *      Headers: X-Reference-Id (our UUID), X-Target-Environment,
 *               Ocp-Apim-Subscription-Key, Authorization.
 *      Body: { amount, currency, externalId, payer:{partyIdType:"MSISDN",
 *              partyId:<phone>}, payerMessage, payeeNote }.
 *      Response: 202 Accepted. Push sent to donor's phone.
 *   3. Donor authorizes.
 *   4. Callback (if configured) or poll GET /requesttopay/{referenceId}.
 */

function baseUrl(mode: string) {
  return mode === "live" ? "https://proxy.momoapi.mtn.com" : "https://sandbox.momodeveloper.mtn.com";
}

async function getToken(orgId: string) {
  const cfg = await loadConfig(orgId, "MTN_MOMO");
  const base = baseUrl(cfg.mode);
  const basic = Buffer.from(`${cfg.secrets.apiUser}:${cfg.secrets.apiKey}`).toString("base64");
  const res = await fetch(`${base}/collection/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Ocp-Apim-Subscription-Key": cfg.secrets.subscriptionKey,
    },
  });
  if (!res.ok) throw new UpstreamError(`MTN MoMo auth failed: ${res.status}`);
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new UpstreamError("MTN MoMo token missing");
  return { token: json.access_token, cfg, base };
}

function normalizePhone(input: string): string {
  // Strip +/spaces/dashes; MTN expects MSISDN E.164 digits only.
  return input.replace(/[^\d]/g, "");
}

export const mtnMomoAdapter: PaymentProviderAdapter = {
  id: "MTN_MOMO",
  label: "MTN Mobile Money",
  flow: "AWAIT_PHONE",

  async createIntent(params: CreateIntentParams): Promise<CreateIntentResult> {
    if (!params.donorPhone) throw new ValidationError("Phone number is required for MTN MoMo");
    if (params.recurring) {
      throw new ValidationError("MTN MoMo recurring donations are not supported yet");
    }

    const { token, cfg, base } = await getToken(params.orgId);
    const phone = normalizePhone(params.donorPhone);
    const referenceId = crypto.randomUUID();
    const externalId = `gfd_${referenceId.slice(0, 8)}`;

    const res = await fetch(`${base}/collection/v1_0/requesttopay`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Reference-Id": referenceId,
        "X-Target-Environment": cfg.publicConfig.targetEnvironment ?? cfg.mode,
        "Ocp-Apim-Subscription-Key": cfg.secrets.subscriptionKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: (params.amountCents / 100).toFixed(0),
        currency: params.currency.toUpperCase(),
        externalId,
        payer: { partyIdType: "MSISDN", partyId: phone },
        payerMessage: "Donation to Gloford",
        payeeNote: params.campaignId ? "Campaign donation" : "General donation",
      }),
    });

    if (res.status !== 202) {
      const text = await res.text();
      throw new UpstreamError(`MTN MoMo requesttopay failed: ${res.status} ${text}`);
    }

    const { donation } = await runAsTenant(params.orgId, async (tx) => {
      const donor = await tx.donor.upsert({
        where: {
          organizationId_email: { organizationId: params.orgId, email: params.donorEmail },
        },
        update: { name: params.donorName ?? undefined, phone },
        create: {
          organizationId: params.orgId,
          email: params.donorEmail,
          name: params.donorName,
          phone,
        },
      });
      const donation = await tx.donation.create({
        data: {
          organizationId: params.orgId,
          donorId: donor.id,
          campaignId: params.campaignId,
          amountCents: params.amountCents,
          currency: params.currency.toUpperCase(),
          provider: "MTN_MOMO",
          providerRef: referenceId,
          type: "ONE_TIME",
          status: "PENDING",
          metadata: { externalId, phone } as never,
        },
      });
      return { donation };
    });

    return {
      kind: "AWAIT_PHONE",
      donationId: donation.id,
      providerRef: referenceId,
      phone,
    };
  },

  async verifyWebhook(req: Request, rawBody: string): Promise<WebhookVerifyResult> {
    // MTN MoMo callback comes as a JSON body. MTN does not sign
    // callbacks by default; operators typically enroll a mutual-TLS
    // callback URL. We add a shared-secret check via an X-Callback-
    // Secret header that the ops team sets server-side when
    // registering the callback URL.
    const secretHeader = req.headers.get("x-callback-secret");
    const expected = process.env.MTN_MOMO_CALLBACK_SECRET;
    if (expected && secretHeader !== expected) {
      throw new ValidationError("MTN MoMo callback secret mismatch");
    }
    const event = JSON.parse(rawBody) as { referenceId?: string; status?: string };
    if (!event.referenceId) throw new ValidationError("MTN MoMo callback missing referenceId");
    return {
      eventId: event.referenceId,
      type: event.status ?? "STATUS_UPDATE",
      event,
    };
  },

  interpretEvent(raw) {
    const event = raw as { referenceId?: string; status?: string };
    if (!event.referenceId) return null;
    const s = event.status?.toUpperCase();
    if (s === "SUCCESSFUL") {
      return { providerRef: event.referenceId, status: "SUCCEEDED", completedAt: new Date() };
    }
    if (s === "FAILED" || s === "REJECTED" || s === "TIMEOUT") {
      return { providerRef: event.referenceId, status: "FAILED" };
    }
    return null;
  },
};

/** Poll status — used both by the public status endpoint and as a
 *  fallback when the callback never fires (common in some markets). */
export async function mtnMomoGetStatus(orgId: string, referenceId: string) {
  const { token, cfg, base } = await getToken(orgId);
  const res = await fetch(`${base}/collection/v1_0/requesttopay/${encodeURIComponent(referenceId)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Target-Environment": cfg.publicConfig.targetEnvironment ?? cfg.mode,
      "Ocp-Apim-Subscription-Key": cfg.secrets.subscriptionKey,
    },
  });
  if (!res.ok) throw new UpstreamError(`MTN MoMo status failed: ${res.status}`);
  return (await res.json()) as { status?: string; reason?: string };
}
