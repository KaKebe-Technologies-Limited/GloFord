import { inngest } from "../client";
import { db } from "@/lib/db";
import { getMailProvider } from "@/lib/mail";
import { donationReceiptEmail } from "@/lib/mail/templates";
import { buildBrand } from "@/lib/mail/brand";

/**
 * Send a donation receipt email when a donation succeeds.
 * Triggered by the same event as donation-tag-donor.
 */
export const donationReceiptSend = inngest.createFunction(
  { id: "donation-receipt-send", retries: 2 },
  { event: "subscriber/donation.succeeded" },
  async ({ event }) => {
    const { donationId } = event.data;
    const extra = event.data as typeof event.data & {
      donorEmail?: string;
      donorName?: string;
      amountCents?: number;
      currency?: string;
    };

    if (!extra.donorEmail) return { sent: false, reason: "no donor email" };

    const donation = await db.donation.findUnique({
      where: { id: donationId },
      include: { campaign: { select: { title: true } } },
    });

    if (!donation) return { sent: false, reason: "donation not found" };

    const brand = await buildBrand();
    const amount = new Intl.NumberFormat("en", {
      style: "currency",
      currency: extra.currency || donation.currency || "USD",
      minimumFractionDigits: 0,
    }).format((extra.amountCents ?? donation.amountCents) / 100);

    const { subject, html, text } = donationReceiptEmail({
      brand,
      amount,
      campaignTitle: donation.campaign?.title ?? undefined,
    });

    await getMailProvider().send({
      to: extra.donorEmail,
      subject,
      html,
      text,
      metadata: { type: "donation-receipt", donationId },
    });

    return { sent: true, to: extra.donorEmail };
  },
);
