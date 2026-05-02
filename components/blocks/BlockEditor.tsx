"use client";

import { useState, useRef } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, Bold, Italic, List, ListOrdered, Link2, Heading2, Heading3, Quote, Code, Undo2, Redo2 } from "lucide-react";
import { BLOCK_META, newBlock, type Block, type BlockType } from "@/lib/blocks/types";
import { Button } from "@/components/ui/Button";
import { MediaPicker } from "@/components/ui/MediaPicker";
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
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)] p-10 text-center text-sm text-[var(--color-muted-fg)]">
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
            className="absolute left-0 top-full z-10 mt-1 grid w-72 grid-cols-1 gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] p-2 shadow-md"
          >
            {(Object.keys(BLOCK_META) as BlockType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => add(t)}
                className="rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm hover:bg-[var(--color-muted)]"
              >
                <p className="font-medium">{BLOCK_META[t].label}</p>
                <p className="text-xs text-[var(--color-muted-fg)]">{BLOCK_META[t].description}</p>
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
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]">
      <header className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-4 py-2">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-fg)]">
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
        "inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] hover:bg-[var(--color-muted)] disabled:pointer-events-none disabled:opacity-40",
        danger && "text-[var(--color-danger)] hover:bg-[rgb(var(--token-danger)/0.10)]",
      )}
    >
      {children}
    </button>
  );
}

// ─── Per-block inline editors ────────────────────────────────

function ImageField({
  label,
  mediaId,
  onChange,
  className,
}: {
  label: string;
  mediaId: string | undefined;
  onChange: (id: string | undefined) => void;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(mediaId ? `/api/media/file/${mediaId}` : null);
  return (
    <div className={className}>
      <span className="mb-1.5 block text-xs font-medium text-[var(--color-muted-fg)]">{label}</span>
      <MediaPicker
        value={mediaId ?? null}
        valueUrl={url}
        onChange={(picked) => {
          if (picked) {
            onChange(picked.id);
            setUrl(picked.url);
          } else {
            onChange(undefined);
            setUrl(null);
          }
        }}
        placeholder={label}
        aspect="16/9"
      />
    </div>
  );
}

function RichTextEditor({ html, onChange }: { html: string; onChange: (html: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showSource, setShowSource] = useState(false);

  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleLink = () => {
    const url = prompt("Enter URL:");
    if (url) exec("createLink", url);
  };

  if (showSource) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setShowSource(false)} className={tbBtnCls}>
            <Undo2 className="h-3.5 w-3.5" /> Visual
          </button>
        </div>
        <textarea
          value={html}
          onChange={(e) => onChange(e.target.value)}
          rows={10}
          className={cn(inputCls, "font-mono text-xs")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-0 rounded-[var(--radius-md)] border border-[var(--color-input)] overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--color-border)] bg-[var(--color-muted)] px-2 py-1.5">
        <button type="button" onClick={() => exec("bold")} className={tbBtnCls} title="Bold"><Bold className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => exec("italic")} className={tbBtnCls} title="Italic"><Italic className="h-3.5 w-3.5" /></button>
        <span className="mx-1 h-4 w-px bg-[var(--color-border)]" />
        <button type="button" onClick={() => exec("formatBlock", "h2")} className={tbBtnCls} title="Heading 2"><Heading2 className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => exec("formatBlock", "h3")} className={tbBtnCls} title="Heading 3"><Heading3 className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => exec("formatBlock", "blockquote")} className={tbBtnCls} title="Quote"><Quote className="h-3.5 w-3.5" /></button>
        <span className="mx-1 h-4 w-px bg-[var(--color-border)]" />
        <button type="button" onClick={() => exec("insertUnorderedList")} className={tbBtnCls} title="Bullet list"><List className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => exec("insertOrderedList")} className={tbBtnCls} title="Numbered list"><ListOrdered className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={handleLink} className={tbBtnCls} title="Insert link"><Link2 className="h-3.5 w-3.5" /></button>
        <span className="mx-1 h-4 w-px bg-[var(--color-border)]" />
        <button type="button" onClick={() => setShowSource(true)} className={tbBtnCls} title="View HTML source"><Code className="h-3.5 w-3.5" /></button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{ __html: html }}
        onBlur={() => {
          if (editorRef.current) onChange(editorRef.current.innerHTML);
        }}
        className="min-h-[120px] bg-[var(--color-bg)] px-4 py-3 text-sm leading-relaxed prose prose-sm max-w-none focus:outline-none [&_a]:text-[var(--color-primary)] [&_a]:underline [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--color-primary)] [&_blockquote]:pl-4 [&_blockquote]:italic"
      />
    </div>
  );
}

const tbBtnCls = "inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-muted-fg)] hover:bg-[var(--color-card)] hover:text-[var(--color-fg)] transition-colors";

function MultiMediaPicker({
  label,
  mediaIds,
  onChange,
}: {
  label: string;
  mediaIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="space-y-2">
      <span className="block text-xs font-medium text-[var(--color-muted-fg)]">{label}</span>
      {mediaIds.length > 0 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {mediaIds.map((id, i) => (
            <div key={`${id}-${i}`} className="group relative aspect-square overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/media/file/${id}`} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(mediaIds.filter((_, idx) => idx !== i))}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                aria-label="Remove"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      {adding ? (
        <MediaPicker
          value={null}
          valueUrl={null}
          onChange={(picked) => {
            if (picked) onChange([...mediaIds, picked.id]);
            setAdding(false);
          }}
          placeholder="Select image"
          aspect="1/1"
        />
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> Add image
        </Button>
      )}
    </div>
  );
}

function BlockForm({ block, onChange }: { block: Block; onChange: (d: unknown) => void }) {
  switch (block.type) {
    case "hero": {
      const d = block.data;
      return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Eyebrow">
            <input type="text" value={d.eyebrow ?? ""} onChange={(e) => onChange({ ...d, eyebrow: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Heading">
            <input type="text" value={d.heading} onChange={(e) => onChange({ ...d, heading: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Subheading" className="md:col-span-2">
            <input type="text" value={d.subheading ?? ""} onChange={(e) => onChange({ ...d, subheading: e.target.value })} className={inputCls} />
          </Field>
          <Field label="CTA label">
            <input type="text" value={d.ctaLabel ?? ""} onChange={(e) => onChange({ ...d, ctaLabel: e.target.value })} className={inputCls} />
          </Field>
          <Field label="CTA href">
            <input type="text" value={d.ctaHref ?? ""} onChange={(e) => onChange({ ...d, ctaHref: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Secondary CTA label">
            <input type="text" value={d.secondaryCtaLabel ?? ""} onChange={(e) => onChange({ ...d, secondaryCtaLabel: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Secondary CTA href">
            <input type="text" value={d.secondaryCtaHref ?? ""} onChange={(e) => onChange({ ...d, secondaryCtaHref: e.target.value })} className={inputCls} />
          </Field>
          <ImageField
            label="Hero image"
            mediaId={d.imageMediaId}
            onChange={(id) => onChange({ ...d, imageMediaId: id })}
            className="md:col-span-2"
          />
        </div>
      );
    }
    case "richText": {
      const d = block.data;
      return <RichTextEditor html={d.html} onChange={(html) => onChange({ ...d, html })} />;
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
      const updateStat = (i: number, patch: Partial<(typeof d.items)[number]>) => {
        const items = d.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
        onChange({ ...d, items });
      };
      const removeStat = (i: number) => onChange({ ...d, items: d.items.filter((_, idx) => idx !== i) });
      const addStat = () => onChange({ ...d, items: [...d.items, { label: "", value: "" }] });
      return (
        <div className="space-y-3">
          <Field label="Heading">
            <input type="text" value={d.heading ?? ""} onChange={(e) => onChange({ ...d, heading: e.target.value })} className={inputCls} />
          </Field>
          <div className="space-y-2">
            {d.items.map((it, i) => (
              <div key={i} className="flex gap-2">
                <input placeholder="Label" value={it.label} onChange={(e) => updateStat(i, { label: e.target.value })} className={inputCls} />
                <input placeholder="Value" value={it.value} onChange={(e) => updateStat(i, { value: e.target.value })} className={inputCls} />
                <button type="button" onClick={() => removeStat(i)} className="text-[var(--color-danger)]" aria-label="Remove stat">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addStat} disabled={d.items.length >= 8}>
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
          <Field label="Intro">
            <input type="text" value={d.intro ?? ""} onChange={(e) => onChange({ ...d, intro: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Limit">
            <input type="number" min={1} max={12} value={d.limit} onChange={(e) => onChange({ ...d, limit: Number(e.target.value) })} className={inputCls} />
          </Field>
        </div>
      );
    }
    case "featureSplit": {
      const d = block.data;
      return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Eyebrow">
            <input type="text" value={d.eyebrow ?? ""} onChange={(e) => onChange({ ...d, eyebrow: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Heading">
            <input type="text" value={d.heading} onChange={(e) => onChange({ ...d, heading: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Body" className="md:col-span-2">
            <textarea value={d.body} onChange={(e) => onChange({ ...d, body: e.target.value })} rows={5} className={inputCls} />
          </Field>
          <Field label="CTA label">
            <input type="text" value={d.ctaLabel ?? ""} onChange={(e) => onChange({ ...d, ctaLabel: e.target.value })} className={inputCls} />
          </Field>
          <Field label="CTA href">
            <input type="text" value={d.ctaHref ?? ""} onChange={(e) => onChange({ ...d, ctaHref: e.target.value })} className={inputCls} />
          </Field>
          <ImageField
            label="Section image"
            mediaId={d.imageMediaId}
            onChange={(id) => onChange({ ...d, imageMediaId: id })}
          />
          <Field label="Reverse layout">
            <select value={d.reverse ? "yes" : "no"} onChange={(e) => onChange({ ...d, reverse: e.target.value === "yes" })} className={inputCls}>
              <option value="no">Image right</option>
              <option value="yes">Image left</option>
            </select>
          </Field>
        </div>
      );
    }
    case "actionCards": {
      const d = block.data;
      const updateCard = (i: number, patch: Partial<(typeof d.items)[number]>) => {
        onChange({ ...d, items: d.items.map((item, idx) => (idx === i ? { ...item, ...patch } : item)) });
      };
      const removeCard = (i: number) => onChange({ ...d, items: d.items.filter((_, idx) => idx !== i) });
      const addCard = () =>
        onChange({
          ...d,
          items: [...d.items, { title: "New card", body: "Describe the action.", href: "/", label: "Explore" }],
        });
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Heading">
              <input type="text" value={d.heading ?? ""} onChange={(e) => onChange({ ...d, heading: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Intro">
              <input type="text" value={d.intro ?? ""} onChange={(e) => onChange({ ...d, intro: e.target.value })} className={inputCls} />
            </Field>
          </div>
          {d.items.map((item, i) => (
            <div key={i} className="grid grid-cols-1 gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 md:grid-cols-2">
              <Field label="Title">
                <input type="text" value={item.title} onChange={(e) => updateCard(i, { title: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Button label">
                <input type="text" value={item.label} onChange={(e) => updateCard(i, { label: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Body" className="md:col-span-2">
                <input type="text" value={item.body} onChange={(e) => updateCard(i, { body: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Href" className="md:col-span-2">
                <input type="text" value={item.href} onChange={(e) => updateCard(i, { href: e.target.value })} className={inputCls} />
              </Field>
              <div className="md:col-span-2">
                <Button type="button" variant="outline" size="sm" onClick={() => removeCard(i)}>
                  <Trash2 className="h-4 w-4" /> Remove card
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addCard} disabled={d.items.length >= 6}>
            <Plus className="h-4 w-4" /> Add card
          </Button>
        </div>
      );
    }
    case "eventList": {
      const d = block.data;
      return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Heading">
            <input type="text" value={d.heading ?? ""} onChange={(e) => onChange({ ...d, heading: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Intro">
            <input type="text" value={d.intro ?? ""} onChange={(e) => onChange({ ...d, intro: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Limit">
            <input type="number" min={1} max={6} value={d.limit} onChange={(e) => onChange({ ...d, limit: Number(e.target.value) })} className={inputCls} />
          </Field>
        </div>
      );
    }
    case "partnerLogos": {
      const d = block.data;
      return (
        <div className="space-y-3">
          <Field label="Heading">
            <input type="text" value={d.heading ?? ""} onChange={(e) => onChange({ ...d, heading: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Intro">
            <input type="text" value={d.intro ?? ""} onChange={(e) => onChange({ ...d, intro: e.target.value })} className={inputCls} />
          </Field>
          <MultiMediaPicker
            label="Partner logos"
            mediaIds={d.mediaIds}
            onChange={(ids) => onChange({ ...d, mediaIds: ids })}
          />
        </div>
      );
    }
    case "pageCollection": {
      const d = block.data;
      return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Heading">
            <input type="text" value={d.heading ?? ""} onChange={(e) => onChange({ ...d, heading: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Collection">
            <select value={d.collection} onChange={(e) => onChange({ ...d, collection: e.target.value })} className={inputCls}>
              <option value="impactStory">Impact stories</option>
              <option value="team">Team / leadership</option>
              <option value="report">Reports</option>
              <option value="partner">Partners</option>
            </select>
          </Field>
          <Field label="Intro" className="md:col-span-2">
            <input type="text" value={d.intro ?? ""} onChange={(e) => onChange({ ...d, intro: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Limit">
            <input type="number" min={1} max={12} value={d.limit} onChange={(e) => onChange({ ...d, limit: Number(e.target.value) })} className={inputCls} />
          </Field>
        </div>
      );
    }
    case "gallery": {
      const d = block.data;
      return (
        <MultiMediaPicker
          label="Gallery images"
          mediaIds={d.mediaIds}
          onChange={(ids) => onChange({ ...d, mediaIds: ids })}
        />
      );
    }
  }
}

const inputCls =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]";

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
      <span className="text-xs font-medium text-[var(--color-muted-fg)]">{label}</span>
      {children}
    </label>
  );
}
