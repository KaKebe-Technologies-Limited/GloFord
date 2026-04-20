import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Mobile Money webhook stub. Provider-specific contract — MTN MoMo
 * posts JSON with {referenceId, status: SUCCESSFUL|FAILED}. Flow:
 *   • Verify via X-Signature header using subscription key.
 *   • Dedupe on referenceId.
 *   • Apply transition to Donation.
 */
export async function POST() {
  return NextResponse.json({ received: true, implemented: false });
}
