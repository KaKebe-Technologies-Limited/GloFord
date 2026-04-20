"use client";

import { useTransition } from "react";
import { setPageStatusAction } from "@/lib/actions/pages";
import type { ContentStatus } from "@prisma/client";

export function PublishControls({ id, status }: { id: string; status: ContentStatus }) {
  const [pending, start] = useTransition();
  const update = (next: ContentStatus) =>
    start(() => setPageStatusAction({ id, status: next }));

  return (
    <select
      disabled={pending}
      value={status}
      onChange={(e) => update(e.target.value as ContentStatus)}
      className="rounded-[--radius-md] border border-[--color-border] bg-[--color-bg] px-3 py-1.5 text-sm"
      aria-label="Page status"
    >
      <option value="DRAFT">Draft</option>
      <option value="REVIEW">In review</option>
      <option value="PUBLISHED">Published</option>
      <option value="ARCHIVED">Archived</option>
    </select>
  );
}
