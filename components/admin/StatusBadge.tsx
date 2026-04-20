import type { ContentStatus } from "@prisma/client";
import { cn } from "@/lib/utils/cn";

const STYLES: Record<ContentStatus, string> = {
  DRAFT: "bg-[--color-muted] text-[--color-muted-fg]",
  REVIEW: "bg-[--color-accent]/20 text-[--color-accent-fg]",
  PUBLISHED: "bg-[--color-success]/20 text-[--color-success]",
  ARCHIVED: "bg-[--color-muted] text-[--color-muted-fg] line-through",
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
