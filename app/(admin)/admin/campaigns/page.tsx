import Link from "next/link";
import { Plus } from "lucide-react";
import { requireActorFromSession } from "@/lib/auth-context";
import { listCampaigns } from "@/lib/services/campaigns";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/utils/money";

export const metadata = { title: "Campaigns" };

export default async function CampaignsPage() {
  const actor = await requireActorFromSession();
  const rows = await listCampaigns(actor.orgId);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fundraising campaigns</h1>
          <p className="text-sm text-[--color-muted-fg]">Targeted donation drives.</p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/campaigns/new">
            <Plus className="h-4 w-4" /> New campaign
          </Link>
        </Button>
      </header>

      <div className="overflow-hidden rounded-[--radius-lg] border border-[--color-border] bg-[--color-card]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[--color-border] bg-[--color-muted]/50 text-left text-xs uppercase tracking-wider text-[--color-muted-fg]">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Goal</th>
                <th className="px-4 py-3">Donations</th>
                <th className="px-4 py-3">Active</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[--color-muted-fg]">
                    No campaigns yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-[--color-border] last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/admin/campaigns/${r.id}`} className="font-medium hover:underline">
                        {r.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[--color-muted-fg]">/donate/{r.slug}</td>
                    <td className="px-4 py-3 text-[--color-muted-fg]">
                      {r.goalCents ? formatMoney(r.goalCents, r.currency) : "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-[--color-muted-fg]">{r._count.donations}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          r.isActive
                            ? "inline-flex items-center rounded-full bg-[--color-success]/20 px-2.5 py-0.5 text-xs font-medium text-[--color-success]"
                            : "inline-flex items-center rounded-full bg-[--color-muted] px-2.5 py-0.5 text-xs font-medium text-[--color-muted-fg]"
                        }
                      >
                        {r.isActive ? "Active" : "Inactive"}
                      </span>
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
