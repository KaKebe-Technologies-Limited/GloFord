import type { ContentStatus } from "@prisma/client";
import { cn } from "@/lib/utils/cn";

const STYLES: Record<ContentStatus, string> = {
  DRAFT: "bg-[var(--color-muted)] text-[var(--color-muted-fg)]",
  REVIEW: "bg-[rgb(var(--token-accent)/0.20)] text-[var(--color-accent-fg)]",
  PUBLISHED: "bg-[rgb(var(--token-success)/0.20)] text-[var(--color-success)]",
  ARCHIVED: "bg-[var(--color-muted)] text-[var(--color-muted-fg)] line-through",
};

const LABELS: Record<ContentStatus, string> = {
  DRAFT: "Draft",
  REVIEW: "Review",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export function StatusBadge({ status }: { status: ContentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STYLES[status],
      )}
    >
      {LABELS[status]}
    </span>
  );
}
