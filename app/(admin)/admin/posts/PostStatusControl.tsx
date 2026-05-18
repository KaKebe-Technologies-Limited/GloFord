"use client";

import { useTransition } from "react";
import { setPostStatusAction } from "@/lib/actions/posts";
import type { ContentStatus } from "@prisma/client";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/Select";

export function PostStatusControl({ id, status }: { id: string; status: ContentStatus }) {
  const [pending, start] = useTransition();
  return (
    <Select
      disabled={pending}
      value={status}
      onValueChange={(v) => start(() => setPostStatusAction({ id, status: v as ContentStatus }))}
    >
      <SelectTrigger className="w-[160px]" aria-label="Post status">
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
