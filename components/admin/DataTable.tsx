"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Plus,
} from "lucide-react";
import { useQueryState } from "nuqs";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchKey?: keyof T & string;
  searchPlaceholder?: string;
  onRowClick?: (row: T) => void;
  emptyState?: {
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
    icon?: React.ElementType;
  };
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchKey,
  searchPlaceholder = "Search...",
  onRowClick,
  emptyState,
}: DataTableProps<T>) {
  const [search, setSearch] = useQueryState("q", { defaultValue: "" });
  const [sortKey, setSortKey] = useQueryState("sort");
  const [sortOrder, setSortOrder] = useQueryState("order", {
    defaultValue: "asc",
  });

  const filteredData = React.useMemo(() => {
    let result = [...data];

    if (search && searchKey) {
      result = result.filter((item) => {
        const value = item[searchKey];
        return String(value).toLowerCase().includes(search.toLowerCase());
      });
    }

    if (sortKey) {
      result.sort((a, b) => {
        const aValue = (a as Record<string, unknown>)[sortKey];
        const bValue = (b as Record<string, unknown>)[sortKey];

        if (aValue === undefined || bValue === undefined) return 0;
        if (String(aValue) < String(bValue)) return sortOrder === "asc" ? -1 : 1;
        if (String(aValue) > String(bValue)) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, search, searchKey, sortKey, sortOrder]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  if (data.length === 0 && emptyState) {
    return <EmptyState {...emptyState} />;
  }

  return (
    <div className="space-y-4">
      {searchKey && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-fg)]" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[rgb(var(--token-muted)/0.50)] text-left text-xs uppercase tracking-wider text-[var(--color-muted-fg)]">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key as string}
                    className={cn(
                      "px-4 py-3 font-semibold",
                      column.sortable && "cursor-pointer hover:text-[var(--color-fg)]",
                      column.className
                    )}
                    onClick={() => column.sortable && toggleSort(column.key as string)}
                  >
                    <div className="flex items-center gap-1">
                      {column.header}
                      {column.sortable && sortKey === column.key && (
                        sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-10 text-center text-[var(--color-muted-fg)]"
                  >
                    No results found.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "group transition-colors hover:bg-[rgb(var(--token-muted)/0.50)]",
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((column) => {
                      const value = (row as Record<string, unknown>)[column.key as string];
                      return (
                        <td
                          key={column.key as string}
                          className={cn("px-4 py-3", column.className)}
                        >
                          {column.render
                            ? column.render(row)
                            : value !== undefined ? String(value) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon: Icon,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-12 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-muted)]">
        {Icon ? (
          <Icon className="h-10 w-10 text-[var(--color-muted-fg)]" />
        ) : (
          <Plus className="h-10 w-10 text-[var(--color-muted-fg)]" />
        )}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-[var(--color-muted-fg)] max-w-sm">
        {description}
      </p>
      {actionLabel && actionHref && (
        <Button asChild className="mt-6">
          <a href={actionHref}>
            <Plus className="h-4 w-4 mr-2" />
            {actionLabel}
          </a>
        </Button>
      )}
    </div>
  );
}
