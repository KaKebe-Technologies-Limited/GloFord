import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mtnMomoGetStatus } from "@/lib/services/payments/mtn-momo";
import { airtelMoneyGetStatus } from "@/lib/services/payments/airtel-money";
import { applyDonationEvent } from "@/lib/services/donations";

/**
 * Public polling endpoint for the DonateWidget's AWAIT_PHONE flow.
 *
 * Contract:
 *   • GET /api/donations/{id}/status
 *   • Returns { status: "PENDING"|"SUCCEEDED"|"FAILED" } — the safe
 *     subset; never leaks donor/payment details.
 *   • Best-effort: for phone-authorized providers, if the DB is still
 *     PENDING we ask the provider directly so the widget unblocks even
 *     if the callback never fires (known Africa-market gotcha).
 *
 * Not authenticated — anyone with a donation id can check its status.
 * The donation id is a cuid and only the originating donor knows it
 * (it's not indexed anywhere).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const row = await db.donation.findUnique({
    where: { id },
    select: { id: true, status: true, provider: true, providerRef: true, organizationId: true },
  });
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (row.status === "PENDING" && (row.provider === "MTN_MOMO" || row.provider === "AIRTEL_MONEY")) {
    try {
      if (row.provider === "MTN_MOMO") {
        const live = await mtnMomoGetStatus(row.organizationId, row.providerRef);
        if (live.status) {
          const s = live.status.toUpperCase();
          if (s === "SUCCESSFUL") {
            await applyDonationEvent({
              providerRef: row.providerRef,
              status: "SUCCEEDED",
              completedAt: new Date(),
            });
            return NextResponse.json({ status: "SUCCEEDED" });
          }
          if (s === "FAILED" || s === "REJECTED" || s === "TIMEOUT") {
            await applyDonationEvent({ providerRef: row.providerRef, status: "FAILED" });
            return NextResponse.json({ status: "FAILED" });
          }
        }
      } else {
        const live = await airtelMoneyGetStatus(row.organizationId, row.providerRef);
        const s = live.data?.transaction?.status?.toUpperCase();
        if (s === "TS" || s === "SUCCESS") {
          await applyDonationEvent({
            providerRef: row.providerRef,
            status: "SUCCEEDED",
            completedAt: new Date(),
          });
          return NextResponse.json({ status: "SUCCEEDED" });
        }
        if (s === "TF" || s === "TX" || s === "FAILED") {
          await applyDonationEvent({ providerRef: row.providerRef, status: "FAILED" });
          return NextResponse.json({ status: "FAILED" });
        }
      }
    } catch {
      // swallow — client will keep polling
    }
  }

  return NextResponse.json({ status: row.status });
}
