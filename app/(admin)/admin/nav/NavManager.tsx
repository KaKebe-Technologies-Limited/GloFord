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
import {
  ConfirmDialog,
  ConfirmDialogAction,
  ConfirmDialogCancel,
  ConfirmDialogContent,
  ConfirmDialogDescription,
  ConfirmDialogFooter,
  ConfirmDialogHeader,
  ConfirmDialogTitle,
  ConfirmDialogTrigger,
} from "@/components/ui/ConfirmDialog";

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
  const [draftParentId, setDraftParentId] = useState("");
  const [draft, setDraft] = useState({ label: "", href: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const add = () => {
    if (!draft.label.trim()) return;
    setError(null);
    const peers = items.filter(
      (i) => i.location === draftLoc && (draftParentId ? i.parentId === draftParentId : i.parentId === null),
    );
    const nextOrder = peers.length ? Math.max(...peers.map((i) => i.order)) + 1 : 0;

    start(async () => {
      try {
        await createNavItemAction({
          location: draftLoc,
          parentId: draftParentId || null,
          label: draft.label.trim(),
          href: draft.href.trim() || null,
          order: nextOrder,
          isActive: true,
        });
        setDraft({ label: "", href: "" });
        setDraftParentId("");
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
    start(async () => {
      try {
        await deleteNavItemAction({ id });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete");
      }
    });
  };

  const move = (siblings: Item[], id: string, dir: -1 | 1) => {
    const sorted = [...siblings].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((i) => i.id === id);
    const current = sorted[idx];
    const swap = sorted[idx + dir];
    if (!current || !swap) return;

    const payload = sorted.map((item, index) => ({
      id: item.id,
      order: item === current ? swap.order : item === swap ? current.order : index,
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
        <p role="alert" className="rounded-[--radius-sm] bg-[--color-danger]/10 p-3 text-sm text-[--color-danger]">
          {error}
        </p>
      ) : null}

      {LOCATIONS.map(({ key, label }) => {
        const list = items.filter((i) => i.location === key).sort((a, b) => a.order - b.order);
        const topLevel = list.filter((i) => !i.parentId);

        return (
          <section key={key} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[--color-muted-fg]">{label}</h2>
            <div className="rounded-[--radius-lg] border border-[--color-border] bg-[--color-card]">
              {list.length === 0 ? (
                <p className="px-4 py-6 text-sm text-[--color-muted-fg]">No items yet.</p>
              ) : (
                <ul className="divide-y divide-[--color-border]">
                  {topLevel.map((parent) => (
                    <NavRow
                      key={parent.id}
                      item={parent}
                      siblings={topLevel}
                      pending={pending}
                      onToggle={toggleActive}
                      onDelete={del}
                      onMove={move}
                    >
                      {list.filter((i) => i.parentId === parent.id)}
                    </NavRow>
                  ))}
                </ul>
              )}
            </div>
          </section>
        );
      })}

      <section className="space-y-3 rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] p-4">
        <h3 className="text-sm font-semibold">Add a link</h3>
        <div className="grid gap-3 md:grid-cols-[170px_200px_1fr_1fr_auto]">
          <select
            aria-label="Nav location"
            value={draftLoc}
            onChange={(e) => {
              setDraftLoc(e.target.value as Location);
              setDraftParentId("");
            }}
            className={inputCls}
          >
            {LOCATIONS.map((l) => (
              <option key={l.key} value={l.key}>
                {l.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Parent link"
            value={draftParentId}
            onChange={(e) => setDraftParentId(e.target.value)}
            className={inputCls}
          >
            <option value="">Top level</option>
            {items
              .filter((item) => item.location === draftLoc && !item.parentId)
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
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
            placeholder="/path or https://..."
            className={inputCls}
          />
          <Button onClick={add} disabled={pending || !draft.label.trim()}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
        <p className="text-xs text-[--color-muted-fg]">
          Create dropdown items by choosing a top-level parent before adding the link.
        </p>
      </section>
    </div>
  );
}

function NavRow({
  item,
  siblings,
  pending,
  onToggle,
  onDelete,
  onMove,
  children,
}: {
  item: Item;
  siblings: Item[];
  pending: boolean;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
  onMove: (siblings: Item[], id: string, dir: -1 | 1) => void;
  children: Item[];
}) {
  return (
    <li className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0">
          <p className="font-medium">{item.label}</p>
          <code className="rounded bg-[--color-muted] px-2 py-0.5 text-xs text-[--color-muted-fg]">{item.href || "-"}</code>
        </div>
        <span className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={item.isActive}
              onChange={(e) => onToggle(item.id, e.target.checked)}
              disabled={pending}
            />
            Active
          </label>
          <Button size="sm" variant="outline" onClick={() => onMove(siblings, item.id, -1)} disabled={pending}>
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => onMove(siblings, item.id, 1)} disabled={pending}>
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
          <ConfirmDialog>
            <ConfirmDialogTrigger asChild>
              <Button size="sm" variant="outline" disabled={pending}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </ConfirmDialogTrigger>
            <ConfirmDialogContent>
              <ConfirmDialogHeader>
                <ConfirmDialogTitle>Delete navigation item?</ConfirmDialogTitle>
                <ConfirmDialogDescription>
                  This will permanently remove &quot;{item.label}&quot; and all its sub-items. This action cannot be undone.
                </ConfirmDialogDescription>
              </ConfirmDialogHeader>
              <ConfirmDialogFooter>
                <ConfirmDialogCancel>Cancel</ConfirmDialogCancel>
                <ConfirmDialogAction onClick={() => onDelete(item.id)}>
                  Delete
                </ConfirmDialogAction>
              </ConfirmDialogFooter>
            </ConfirmDialogContent>
          </ConfirmDialog>
        </span>
      </div>
      {children.length > 0 ? (
        <ul className="mt-3 space-y-2 border-l border-[--color-border] pl-4">
          {children
            .sort((a, b) => a.order - b.order)
            .map((child) => (
              <li key={child.id} className="flex items-center gap-3 rounded-[--radius-md] bg-[--color-secondary]/60 px-3 py-2">
                <div className="min-w-0">
                  <p className="font-medium">{child.label}</p>
                  <code className="rounded bg-white px-2 py-0.5 text-xs text-[--color-muted-fg]">{child.href || "-"}</code>
                </div>
                <span className="ml-auto flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      checked={child.isActive}
                      onChange={(e) => onToggle(child.id, e.target.checked)}
                      disabled={pending}
                    />
                    Active
                  </label>
                  <Button size="sm" variant="outline" onClick={() => onMove(children, child.id, -1)} disabled={pending}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onMove(children, child.id, 1)} disabled={pending}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <ConfirmDialog>
                    <ConfirmDialogTrigger asChild>
                      <Button size="sm" variant="outline" disabled={pending}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </ConfirmDialogTrigger>
                    <ConfirmDialogContent>
                      <ConfirmDialogHeader>
                        <ConfirmDialogTitle>Delete sub-item?</ConfirmDialogTitle>
                        <ConfirmDialogDescription>
                          This will remove &quot;{child.label}&quot;. This action cannot be undone.
                        </ConfirmDialogDescription>
                      </ConfirmDialogHeader>
                      <ConfirmDialogFooter>
                        <ConfirmDialogCancel>Cancel</ConfirmDialogCancel>
                        <ConfirmDialogAction onClick={() => onDelete(child.id)}>
                          Delete
                        </ConfirmDialogAction>
                      </ConfirmDialogFooter>
                    </ConfirmDialogContent>
                  </ConfirmDialog>
                </span>
              </li>
            ))}
        </ul>
      ) : null}
    </li>
  );
}

const inputCls =
  "w-full rounded-[--radius-md] border border-[--color-input] bg-[--color-bg] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-ring]";
