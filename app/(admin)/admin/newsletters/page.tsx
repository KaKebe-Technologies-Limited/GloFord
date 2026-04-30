import Link from "next/link";
import { Plus } from "lucide-react";
import { requireActorFromSession } from "@/lib/auth-context";
import { listNewsletters } from "@/lib/services/newsletters";
import { Button } from "@/components/ui/Button";
import { NewsletterStatusBadge } from "./StatusBadge";

export const metadata = { title: "Newsletters" };

export default async function NewslettersPage() {
  await requireActorFromSession();
  const rows = await listNewsletters();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Newsletters</h1>
          <p className="text-sm text-[var(--color-muted-fg)]">One-off broadcasts to your subscribers.</p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/newsletters/new">
            <Plus className="h-4 w-4" /> New newsletter
          </Link>
        </Button>
      </header>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[rgb(var(--token-muted)/0.50)] text-left text-xs uppercase tracking-wider text-[var(--color-muted-fg)]">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Sent / Scheduled</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[var(--color-muted-fg)]">
                    No newsletters yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/admin/newsletters/${r.id}`} className="font-medium hover:underline">
                        {r.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">{r.subject}</td>
                    <td className="px-4 py-3">
                      <NewsletterStatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                      {r.sentAt
                        ? new Date(r.sentAt).toLocaleString()
                        : r.scheduledAt
                        ? new Date(r.scheduledAt).toLocaleString()
                        : "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                      {new Date(r.updatedAt).toLocaleDateString()}
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
