import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  totalPages,
  total,
  basePath,
}: {
  page: number;
  totalPages: number;
  total: number;
  basePath: string;
}) {
  if (totalPages <= 1) return null;

  function href(p: number) {
    return p === 1 ? basePath : `${basePath}?page=${p}`;
  }

  return (
    <div className="flex items-center justify-between text-sm">
      <p className="text-[var(--color-muted-fg)]">
        Page {page} of {totalPages} ({total} total)
      </p>
      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link
            href={href(page - 1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] hover:bg-[var(--color-muted)]"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
        ) : (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] opacity-40">
            <ChevronLeft className="h-4 w-4" />
          </span>
        )}
        {page < totalPages ? (
          <Link
            href={href(page + 1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] hover:bg-[var(--color-muted)]"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] opacity-40">
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </div>
  );
}
