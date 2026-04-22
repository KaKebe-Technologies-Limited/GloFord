import Link from "next/link";
import { Plus, Send } from "lucide-react";
import { requireActorFromSession } from "@/lib/auth-context";
import { listEmailCampaigns } from "@/lib/services/emailCampaigns";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "Email campaigns" };

const TRIGGER_LABEL: Record<string, string> = {
  ON_SIGNUP: "On signup",
  ON_DONATION: "On donation",
  SCHEDULED: "Scheduled",
  MANUAL: "Manual",
};

export default async function EmailCampaignsPage() {
  const actor = await requireActorFromSession();
  const rows = await listEmailCampaigns(actor.orgId);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Email campaigns</h1>
          <p className="text-sm text-[--color-muted-fg]">
            Automated email sequences triggered by subscriber or donation events.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/email-campaigns/new">
            <Plus className="h-4 w-4" /> New campaign
          </Link>
        </Button>
      </header>

      <div className="overflow-hidden rounded-[--radius-lg] border border-[--color-border] bg-[--color-card]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[--color-border] bg-[--color-muted]/50 text-left text-xs uppercase tracking-wider text-[--color-muted-fg]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Trigger</th>
                <th className="px-4 py-3">Steps</th>
                <th className="px-4 py-3">Enrollments</th>
                <th className="px-4 py-3">State</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-[--color-muted-fg]">
                    <Send className="mx-auto mb-2 h-6 w-6 opacity-60" aria-hidden="true" />
                    No campaigns yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-[--color-border] last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/email-campaigns/${r.id}`}
                        className="font-medium hover:underline"
                      >
                        {r.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[--color-muted-fg]">
                      {TRIGGER_LABEL[r.trigger] ?? r.trigger}
                    </td>
                    <td className="px-4 py-3 text-[--color-muted-fg]">{r._count.emails}</td>
                    <td className="px-4 py-3 text-[--color-muted-fg]">{r._count.enrollments}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs " +
                          (r.isActive
                            ? "bg-[--color-success]/10 text-[--color-success]"
                            : "bg-[--color-muted] text-[--color-muted-fg]")
                        }
                      >
                        {r.isActive ? "Active" : "Paused"}
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
