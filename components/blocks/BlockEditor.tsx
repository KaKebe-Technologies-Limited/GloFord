"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { BLOCK_META, newBlock, type Block, type BlockType } from "@/lib/blocks/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

/**
 * Minimal block editor.
 *
 * Phase 2 scope: list-based editor. Reorder (up/down), add (picker),
 * remove, and edit-in-place via block-specific forms. Drag-and-drop is
 * explicitly deferred to a later polish pass — the data model is
 * already a flat array, so upgrading doesn't require migration.
 */
export function BlockEditor({
  value,
  onChange,
}: {
  value: Block[];
  onChange: (next: Block[]) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const add = (type: BlockType) => {
    onChange([...value, newBlock(type)]);
    setPickerOpen(false);
  };
  const remove = (id: string) => onChange(value.filter((b) => b.id !== id));
  const move = (id: string, dir: -1 | 1) => {
    const i = value.findIndex((b) => b.id === id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const a = value[i];
    const b = value[j];
    if (!a || !b) return;
    const next = [...value];
    next[i] = b;
    next[j] = a;
    onChange(next);
  };
  const update = (id: string, data: unknown) =>
    onChange(
      value.map((b) => (b.id === id ? ({ ...b, data } as Block) : b)),
    );

  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <div className="rounded-[--radius-lg] border border-dashed border-[--color-border] bg-[--color-muted] p-10 text-center text-sm text-[--color-muted-fg]">
          No blocks yet. Add your first block below.
        </div>
      ) : (
        value.map((b, i) => (
          <BlockCard
            key={b.id}
            block={b}
            isFirst={i === 0}
            isLast={i === value.length - 1}
            onMoveUp={() => move(b.id, -1)}
            onMoveDown={() => move(b.id, 1)}
            onRemove={() => remove(b.id)}
            onUpdate={(d) => update(b.id, d)}
          />
        ))
      )}

      <div className="relative">
        <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen((v) => !v)}>
          <Plus className="h-4 w-4" /> Add block
        </Button>
        {pickerOpen ? (
          <div
            role="menu"
            className="absolute left-0 top-full z-10 mt-1 grid w-72 grid-cols-1 gap-1 rounded-[--radius-md] border border-[--color-border] bg-[--color-card] p-2 shadow-md"
          >
            {(Object.keys(BLOCK_META) as BlockType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => add(t)}
                className="rounded-[--radius-sm] px-3 py-2 text-left text-sm hover:bg-[--color-muted]"
              >
                <p className="font-medium">{BLOCK_META[t].label}</p>
                <p className="text-xs text-[--color-muted-fg]">{BLOCK_META[t].description}</p>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function BlockCard({
  block,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
  onUpdate,
}: {
  block: Block;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onUpdate: (data: unknown) => void;
}) {
  return (
    <div className="rounded-[--radius-lg] border border-[--color-border] bg-[--color-card]">
      <header className="flex items-center justify-between gap-2 border-b border-[--color-border] px-4 py-2">
        <p className="text-xs font-medium uppercase tracking-wider text-[--color-muted-fg]">
          {BLOCK_META[block.type].label}
        </p>
        <div className="flex items-center gap-1">
          <IconBtn label="Move up" disabled={isFirst} onClick={onMoveUp}>
            <ChevronUp className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Move down" disabled={isLast} onClick={onMoveDown}>
            <ChevronDown className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Remove block" onClick={onRemove} danger>
            <Trash2 className="h-4 w-4" />
          </IconBtn>
        </div>
      </header>
      <div className="p-4">
        <BlockForm block={block} onChange={onUpdate} />
      </div>
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-[--radius-sm] hover:bg-[--color-muted] disabled:pointer-events-none disabled:opacity-40",
        danger && "text-[--color-danger] hover:bg-[--color-danger]/10",
      )}
    >
      {children}
    </button>
  );
}

// ─── Per-block inline editors ────────────────────────────────

function BlockForm({ block, onChange }: { block: Block; onChange: (d: unknown) => void }) {
  switch (block.type) {
    case "hero": {
      const d = block.data;
      return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Heading">
            <input type="text" value={d.heading} onChange={(e) => onChange({ ...d, heading: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Subheading">
            <input type="text" value={d.subheading ?? ""} onChange={(e) => onChange({ ...d, subheading: e.target.value })} className={inputCls} />
          </Field>
          <Field label="CTA label">
            <input type="text" value={d.ctaLabel ?? ""} onChange={(e) => onChange({ ...d, ctaLabel: e.target.value })} className={inputCls} />
          </Field>
          <Field label="CTA href">
            <input type="text" value={d.ctaHref ?? ""} onChange={(e) => onChange({ ...d, ctaHref: e.target.value })} className={inputCls} />
          </Field>
        </div>
      );
    }
    case "richText": {
      const d = block.data;
      return (
        <Field label="HTML content">
          <textarea
            value={d.html}
            onChange={(e) => onChange({ ...d, html: e.target.value })}
            rows={8}
            className={cn(inputCls, "font-mono text-xs")}
          />
        </Field>
      );
    }
    case "cta": {
      const d = block.data;
      return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Heading" className="md:col-span-2">
            <input type="text" value={d.heading} onChange={(e) => onChange({ ...d, heading: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Body" className="md:col-span-2">
            <input type="text" value={d.body ?? ""} onChange={(e) => onChange({ ...d, body: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Button label">
            <input type="text" value={d.buttonLabel} onChange={(e) => onChange({ ...d, buttonLabel: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Button href">
            <input type="text" value={d.buttonHref} onChange={(e) => onChange({ ...d, buttonHref: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Variant">
            <select value={d.variant} onChange={(e) => onChange({ ...d, variant: e.target.value })} className={inputCls}>
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="outline">Outline</option>
            </select>
          </Field>
        </div>
      );
    }
    case "stats": {
      const d = block.data;
      const update = (i: number, patch: Partial<(typeof d.items)[number]>) => {
        const items = d.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
        onChange({ ...d, items });
      };
      const remove = (i: number) => onChange({ ...d, items: d.items.filter((_, idx) => idx !== i) });
      const add = () => onChange({ ...d, items: [...d.items, { label: "", value: "" }] });
      return (
        <div className="space-y-3">
          <Field label="Heading">
            <input type="text" value={d.heading ?? ""} onChange={(e) => onChange({ ...d, heading: e.target.value })} className={inputCls} />
          </Field>
          <div className="space-y-2">
            {d.items.map((it, i) => (
              <div key={i} className="flex gap-2">
                <input placeholder="Label" value={it.label} onChange={(e) => update(i, { label: e.target.value })} className={inputCls} />
                <input placeholder="Value" value={it.value} onChange={(e) => update(i, { value: e.target.value })} className={inputCls} />
                <button type="button" onClick={() => remove(i)} className="text-[--color-danger]" aria-label="Remove stat">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={add} disabled={d.items.length >= 8}>
            <Plus className="h-4 w-4" /> Add stat
          </Button>
        </div>
      );
    }
    case "donateCta": {
      const d = block.data;
      return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Heading" className="md:col-span-2">
            <input type="text" value={d.heading} onChange={(e) => onChange({ ...d, heading: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Body" className="md:col-span-2">
            <input type="text" value={d.body ?? ""} onChange={(e) => onChange({ ...d, body: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Campaign slug (optional)">
            <input type="text" value={d.campaignSlug ?? ""} onChange={(e) => onChange({ ...d, campaignSlug: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Button label">
            <input type="text" value={d.buttonLabel} onChange={(e) => onChange({ ...d, buttonLabel: e.target.value })} className={inputCls} />
          </Field>
        </div>
      );
    }
    case "programGrid":
    case "postList": {
      const d = block.data;
      return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Heading">
            <input type="text" value={d.heading ?? ""} onChange={(e) => onChange({ ...d, heading: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Limit">
            <input
              type="number"
              min={1}
              max={12}
              value={d.limit}
              onChange={(e) => onChange({ ...d, limit: Number(e.target.value) })}
              className={inputCls}
            />
          </Field>
        </div>
      );
    }
    case "gallery": {
      const d = block.data;
      return (
        <Field label="Media IDs (comma-separated)">
          <textarea
            value={d.mediaIds.join(", ")}
            onChange={(e) => onChange({ ...d, mediaIds: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
            rows={3}
            className={cn(inputCls, "font-mono text-xs")}
          />
        </Field>
      );
    }
  }
}

const inputCls =
  "w-full rounded-[--radius-md] border border-[--color-input] bg-[--color-bg] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-ring]";

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-xs font-medium text-[--color-muted-fg]">{label}</span>
      {children}
    </label>
  );
}
