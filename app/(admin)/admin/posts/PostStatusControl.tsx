"use client";

import { useTransition } from "react";
import { setPostStatusAction } from "@/lib/actions/posts";
import type { ContentStatus } from "@prisma/client";

export function PostStatusControl({ id, status }: { id: string; status: ContentStatus }) {
  const [pending, start] = useTransition();
  return (
    <select
      disabled={pending}
      value={status}
      onChange={(e) => start(() => setPostStatusAction({ id, status: e.target.value as ContentStatus }))}
      className="rounded-[--radius-md] border border-[--color-border] bg-[--color-bg] px-3 py-1.5 text-sm"
      aria-label="Post status"
    >
      <option value="DRAFT">Draft</option>
      <option value="REVIEW">In review</option>
      <option value="PUBLISHED">Published</option>
      <option value="ARCHIVED">Archived</option>
    </select>
  );
}
