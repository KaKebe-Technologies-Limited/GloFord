"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import {
  createNavItemAction,
  updateNavItemAction,
  deleteNavItemAction,
  reorderNavItemsAction,
} from "@/lib/actions/nav";
import { Button } from "@/components/ui/Button";

type Location = "HEADER" | "FOOTER" | "ADMIN_SIDEBAR";

type Item = {
  id: string;
  location: Location;
  parentId: string | null;
  label: string;
  href: string;
  pageId: string;
  order: number;
  isActive: boolean;
};

const LOCATIONS: { key: Location; label: string }[] = [
  { key: "HEADER", label: "Header" },
  { key: "FOOTER", label: "Footer" },
  { key: "ADMIN_SIDEBAR", label: "Admin sidebar" },
];

export function NavManager({ items }: { items: Item[] }) {
  const [draftLoc, setDraftLoc] = useState<Location>("HEADER");
  const [draft, setDraft] = useState({ label: "", href: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const add = () => {
    if (!draft.label.trim()) return;
    setError(null);
    const peers = items.filter((i) => i.location === draftLoc);
    const nextOrder = peers.length ? Math.max(...peers.map((i) => i.order)) + 1 : 0;
    start(async () => {
      try {
        await createNavItemAction({
          location: draftLoc,
          label: draft.label.trim(),
          href: draft.href.trim() || null,
          order: nextOrder,
          isActive: true,
        });
        setDraft({ label: "", href: "" });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add");
      }
    });
  };

  const toggleActive = (id: string, isActive: boolean) => {
    start(async () => {
      try {
        await updateNavItemAction({ id, isActive });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to toggle");
      }
    });
  };

  const del = (id: string) => {
    if (!confirm("Delete this nav item?")) return;
    start(async () => {
      try {
        await deleteNavItemAction({ id });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete");
      }
    });
  };

  const move = (items: Item[], id: string, dir: -1 | 1) => {
    const sorted = [...items].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((i) => i.id === id);
    const current = sorted[idx];
    const swap = sorted[idx + dir];
    if (!current || !swap) return;
    const payload = sorted.map((i, index) => ({
      id: i.id,
      order: i === current ? swap.order : i === swap ? current.order : index,
    }));
    start(async () => {
      try {
        await reorderNavItemsAction({ items: payload });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to reorder");
      }
    });
  };

  return (
    <div className="space-y-8">
      {error ? (
        <p
          role="alert"
          className="rounded-[--radius-sm] bg-[--color-danger]/10 p-3 text-sm text-[--color-danger]"
        >
          {error}
        </p>
      ) : null}

      {LOCATIONS.map(({ key, label }) => {
        const list = items
          .filter((i) => i.location === key)
          .sort((a, b) => a.order - b.order);
        return (
          <section key={key} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[--color-muted-fg]">
              {label}
            </h2>
            <div className="rounded-[--radius-lg] border border-[--color-border] bg-[--color-card]">
              {list.length === 0 ? (
                <p className="px-4 py-6 text-sm text-[--color-muted-fg]">No items yet.</p>
              ) : (
                <ul className="divide-y divide-[--color-border]">
                  {list.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="font-medium">{item.label}</span>
                      <code className="rounded bg-[--color-muted] px-2 py-0.5 text-xs text-[--color-muted-fg]">
                        {item.href || "—"}
                      </code>
                      <span className="ml-auto flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-xs">
                          <input
                            type="checkbox"
                            checked={item.isActive}
                            onChange={(e) => toggleActive(item.id, e.target.checked)}
                            disabled={pending}
                          />
                          Active
                        </label>
                        <Button size="sm" variant="outline" onClick={() => move(list, item.id, -1)} disabled={pending}>
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => move(list, item.id, 1)} disabled={pending}>
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => del(item.id)} disabled={pending}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        );
      })}

      <section className="space-y-3 rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] p-4">
        <h3 className="text-sm font-semibold">Add a link</h3>
        <div className="grid gap-3 md:grid-cols-[180px_1fr_1fr_auto]">
          <select
            aria-label="Nav location"
            value={draftLoc}
            onChange={(e) => setDraftLoc(e.target.value as Location)}
            className={inputCls}
          >
            {LOCATIONS.map((l) => (
              <option key={l.key} value={l.key}>
                {l.label}
              </option>
            ))}
          </select>
          <input
            value={draft.label}
            onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
            placeholder="Label"
            className={inputCls}
          />
          <input
            value={draft.href}
            onChange={(e) => setDraft((d) => ({ ...d, href: e.target.value }))}
            placeholder="/path or https://…"
            className={inputCls}
          />
          <Button onClick={add} disabled={pending || !draft.label.trim()}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </section>
    </div>
  );
}

const inputCls =
  "w-full rounded-[--radius-md] border border-[--color-input] bg-[--color-bg] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-ring]";
