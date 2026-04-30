import Link from "next/link";
import { Plus } from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";

type Row = {
  id: string;
  slug: string;
  title: string;
  status: string;
  updatedAt: Date;
  seoDesc?: string | null;
};

export function CuratedPageCollectionTable({
  title,
  description,
  createHref,
  rows,
}: {
  title: string;
  description: string;
  createHref: string;
  rows: Row[];
}) {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-[var(--color-muted-fg)]">{description}</p>
        </div>
        <Button asChild size="sm">
          <Link href={createHref}>
            <Plus className="h-4 w-4" /> New
          </Link>
        </Button>
      </header>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[rgb(var(--token-muted)/0.50)] text-left text-xs uppercase tracking-wider text-[var(--color-muted-fg)]">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Summary</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[var(--color-muted-fg)]">
                    No entries yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/admin/pages/${row.id}`} className="font-medium hover:underline">
                        {row.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-muted-fg)]">{row.slug}</td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">{row.seoDesc ?? "-"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status as never} />
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">{new Date(row.updatedAt).toLocaleDateString()}</td>
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
