import Link from "next/link";
import { requireActorFromSession } from "@/lib/auth-context";
import { listDonations } from "@/lib/services/donations";
import { formatMoney } from "@/lib/utils/money";
import { Pagination } from "@/components/admin/Pagination";
import { DonationStatusBadge } from "./StatusBadge";
import { RefundButton } from "./RefundButton";

export const metadata = { title: "Donations" };

export default async function DonationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireActorFromSession();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, total, totalPages } = await listDonations({ page, perPage: 50 });

  const totalRaisedByCurrency = rows
    .filter((r) => r.status === "SUCCEEDED")
    .reduce<Record<string, number>>((acc, r) => {
      acc[r.currency] = (acc[r.currency] ?? 0) + r.amountCents;
      return acc;
    }, {});

  const raisedLabel = Object.entries(totalRaisedByCurrency)
    .map(([currency, cents]) => formatMoney(cents, currency))
    .join(" + ") || formatMoney(0, "USD");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Donations</h1>
        <p className="text-sm text-[var(--color-muted-fg)]">
          {total} records &middot; {raisedLabel} succeeded on this page
        </p>
      </header>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[rgb(var(--token-muted)/0.50)] text-left text-xs uppercase tracking-wider text-[var(--color-muted-fg)]">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Donor</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 w-0">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[var(--color-muted-fg)]">
                    No donations yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {r.donor ? (
                        <div>
                          <p className="font-medium">{r.donor.name ?? r.donor.email}</p>
                          {r.donor.name ? (
                            <p className="text-xs text-[var(--color-muted-fg)]">{r.donor.email}</p>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-[var(--color-muted-fg)]">Anonymous</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatMoney(r.amountCents, r.currency)}
                      {r.type === "RECURRING" ? (
                        <span className="ml-1 text-xs text-[var(--color-muted-fg)]">/mo</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {r.campaign ? (
                        <Link href={`/admin/campaigns/${r.campaign.id}`} className="hover:underline">
                          {r.campaign.title}
                        </Link>
                      ) : (
                        <span className="text-[var(--color-muted-fg)]">&mdash;</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">{r.provider}</td>
                    <td className="px-4 py-3">
                      <DonationStatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      {r.status === "SUCCEEDED" ? (
                        <RefundButton
                          id={r.id}
                          amountLabel={formatMoney(r.amountCents, r.currency)}
                        />
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} total={total} basePath="/admin/donations" />
    </div>
  );
}
