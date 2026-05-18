"use client";

import { useTransition } from "react";
import { setProgramStatusAction } from "@/lib/actions/programs";
import type { ContentStatus } from "@prisma/client";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/Select";

export function ProgramStatusControl({ id, status }: { id: string; status: ContentStatus }) {
  const [pending, start] = useTransition();
  return (
    <Select
      disabled={pending}
      value={status}
      onValueChange={(v) => start(() => setProgramStatusAction({ id, status: v as ContentStatus }))}
    >
      <SelectTrigger className="w-[160px]" aria-label="Program status">
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
