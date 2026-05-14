"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { deletePageAction, setPageStatusAction } from "@/lib/actions/pages";
import {
  ConfirmDialog,
  ConfirmDialogTrigger,
  ConfirmDialogContent,
  ConfirmDialogHeader,
  ConfirmDialogTitle,
  ConfirmDialogDescription,
  ConfirmDialogFooter,
  ConfirmDialogAction,
  ConfirmDialogCancel,
} from "@/components/ui/ConfirmDialog";

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
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

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

      {error && (
        <div role="alert" className="rounded-[var(--radius-md)] border border-[var(--color-danger)] bg-[rgb(var(--token-danger)/0.08)] p-3 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

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
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[var(--color-muted-fg)]">
                    No entries yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--color-border)] last:border-0 group hover:bg-[rgb(var(--token-muted)/0.50)]">
                    <td className="px-4 py-3">
                      <Link href={`/admin/pages/${row.id}`} className="font-medium hover:underline">
                        {row.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-muted-fg)]">{row.slug}</td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">{row.seoDesc ?? "-"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={async () => {
                          setError(null);
                          try {
                            const next = row.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
                            await setPageStatusAction({ id: row.id, status: next });
                            router.refresh();
                          } catch (e) {
                            setError(e instanceof Error ? e.message : "Failed to update status");
                          }
                        }}
                        className="cursor-pointer"
                        title={`Click to ${row.status === "PUBLISHED" ? "unpublish" : "publish"}`}
                      >
                        <StatusBadge status={row.status as never} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">{new Date(row.updatedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/pages/${row.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <ConfirmDialog>
                          <ConfirmDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
                            </Button>
                          </ConfirmDialogTrigger>
                          <ConfirmDialogContent>
                            <ConfirmDialogHeader>
                              <ConfirmDialogTitle>Delete &quot;{row.title}&quot;</ConfirmDialogTitle>
                              <ConfirmDialogDescription>
                                This will permanently delete this page and all its content. This action cannot be undone.
                              </ConfirmDialogDescription>
                            </ConfirmDialogHeader>
                            <ConfirmDialogFooter>
                              <ConfirmDialogCancel>Cancel</ConfirmDialogCancel>
                              <ConfirmDialogAction
                                onClick={async () => {
                                  setError(null);
                                  try {
                                    await deletePageAction({ id: row.id });
                                    router.refresh();
                                  } catch (e) {
                                    setError(e instanceof Error ? e.message : "Delete failed");
                                  }
                                }}
                              >
                                Delete
                              </ConfirmDialogAction>
                            </ConfirmDialogFooter>
                          </ConfirmDialogContent>
                        </ConfirmDialog>
                      </div>
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
