"use client";

import Link from "next/link";
import { Briefcase } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { Program, ContentStatus } from "@prisma/client";

type ProgramRow = Program;

const columns: Column<ProgramRow>[] = [
  {
    key: "title",
    header: "Title",
    sortable: true,
    render: (row) => (
      <Link href={`/admin/programs/${row.id}`} className="font-medium hover:underline">
        {row.title}
      </Link>
    ),
  },
  {
    key: "slug",
    header: "Slug",
    sortable: true,
    render: (row) => (
      <code className="rounded bg-[--color-muted] px-2 py-0.5 text-xs text-[--color-muted-fg]">
        /programs/{row.slug}
      </code>
    ),
  },
  {
    key: "order",
    header: "Order",
    sortable: true,
    className: "text-[--color-muted-fg]",
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => <StatusBadge status={row.status as ContentStatus} />,
  },
  {
    key: "updatedAt",
    header: "Updated",
    sortable: true,
    render: (row) => (
      <span className="text-[--color-muted-fg]">
        {new Date(row.updatedAt).toLocaleDateString()}
      </span>
    ),
  },
];

export function ProgramListClient({ data }: { data: ProgramRow[] }) {
  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="title"
      searchPlaceholder="Search programs..."
      emptyState={{
        title: "No programs yet",
        description: "Your initiatives will appear here once you create them.",
        actionLabel: "New program",
        actionHref: "/admin/programs/new",
        icon: Briefcase,
      }}
    />
  );
}
