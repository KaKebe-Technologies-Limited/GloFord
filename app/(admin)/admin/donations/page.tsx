import Link from "next/link";
import { requireActorFromSession } from "@/lib/auth-context";
import { listDonations } from "@/lib/services/donations";
import { formatMoney } from "@/lib/utils/money";
import { DonationStatusBadge } from "./StatusBadge";

export const metadata = { title: "Donations" };

export default async function DonationsPage() {
  const actor = await requireActorFromSession();
  const rows = await listDonations(actor.orgId);

  const totalRaised = rows
    .filter((r) => r.status === "SUCCEEDED")
    .reduce((s, r) => s + r.amountCents, 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Donations</h1>
        <p className="text-sm text-[--color-muted-fg]">
          {rows.length} records \u00b7 {formatMoney(totalRaised, "USD")} succeeded (last 100)
        </p>
      </header>

      <div className="overflow-hidden rounded-[--radius-lg] border border-[--color-border] bg-[--color-card]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[--color-border] bg-[--color-muted]/50 text-left text-xs uppercase tracking-wider text-[--color-muted-fg]">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Donor</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[--color-muted-fg]">
                    No donations yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-[--color-border] last:border-0">
                    <td className="px-4 py-3 text-[--color-muted-fg]">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {r.donor ? (
                        <div>
                          <p className="font-medium">{r.donor.name ?? r.donor.email}</p>
                          {r.donor.name ? (
                            <p className="text-xs text-[--color-muted-fg]">{r.donor.email}</p>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-[--color-muted-fg]">Anonymous</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatMoney(r.amountCents, r.currency)}
                      {r.type === "RECURRING" ? (
                        <span className="ml-1 text-xs text-[--color-muted-fg]">/mo</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {r.campaign ? (
                        <Link href={`/admin/campaigns/${r.campaign.id}`} className="hover:underline">
                          {r.campaign.title}
                        </Link>
                      ) : (
                        <span className="text-[--color-muted-fg]">\u2014</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[--color-muted-fg]">{r.provider}</td>
                    <td className="px-4 py-3">
                      <DonationStatusBadge status={r.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
