"use client";

import Link from "next/link";
import { PenTool } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { Post, ContentStatus, User } from "@prisma/client";

interface PostRow extends Post {
  author?: User | null;
}

const columns: Column<PostRow>[] = [
  {
    key: "title",
    header: "Title",
    sortable: true,
    render: (row) => (
      <Link href={`/admin/posts/${row.id}`} className="font-medium hover:underline">
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
        /blog/{row.slug}
      </code>
    ),
  },
  {
    key: "author",
    header: "Author",
    render: (row) => (
      <span className="text-[--color-muted-fg]">
        {row.author?.name ?? row.author?.email ?? "\u2014"}
      </span>
    ),
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

export function PostListClient({ data }: { data: PostRow[] }) {
  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="title"
      searchPlaceholder="Search posts..."
      emptyState={{
        title: "No posts yet",
        description: "Your stories and updates will appear here once you write them.",
        actionLabel: "New post",
        actionHref: "/admin/posts/new",
        icon: PenTool,
      }}
    />
  );
}
