import Link from "next/link";
import { Plus } from "lucide-react";
import { requireActorFromSession } from "@/lib/auth-context";
import { listPages } from "@/lib/services/pages";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "Pages" };

export default async function PagesListPage() {
  await requireActorFromSession();
  const rows = await listPages();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pages</h1>
          <p className="text-sm text-[--color-muted-fg]">Standalone pages like /about or /contact.</p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/pages/new">
            <Plus className="h-4 w-4" /> New page
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
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-[--color-muted-fg]">
                    No pages yet. Create your first page to get started.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-[--color-border] last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/admin/pages/${r.id}`} className="font-medium hover:underline">
                        {r.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[--color-muted-fg]">/{r.slug}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-[--color-muted-fg]">
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
