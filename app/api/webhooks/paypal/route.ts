import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * PayPal webhook stub. Full implementation:
 *   • Validate Paypal-Transmission-Sig header against paypal.com cert.
 *   • Dedupe via WebhookEvent on transmission id.
 *   • Apply CHECKOUT.ORDER.APPROVED / PAYMENT.CAPTURE.COMPLETED /
 *     PAYMENT.CAPTURE.REFUNDED events to the Donation.
 */
export async function POST() {
  return NextResponse.json({ received: true, implemented: false });
}
