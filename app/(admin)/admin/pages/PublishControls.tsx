"use client";

import { useTransition } from "react";
import { setPageStatusAction } from "@/lib/actions/pages";
import type { ContentStatus } from "@prisma/client";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/Select";

export function PublishControls({ id, status }: { id: string; status: ContentStatus }) {
  const [pending, start] = useTransition();
  const update = (next: ContentStatus) =>
    start(() => setPageStatusAction({ id, status: next }));

  return (
    <Select
      disabled={pending}
      value={status}
      onValueChange={(v) => update(v as ContentStatus)}
    >
      <SelectTrigger className="w-[160px]" aria-label="Page status">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="DRAFT">Draft</SelectItem>
        <SelectItem value="REVIEW">In review</SelectItem>
        <SelectItem value="PUBLISHED">Published</SelectItem>
        <SelectItem value="ARCHIVED">Archived</SelectItem>
      </SelectContent>
    </Select>
  );
}
