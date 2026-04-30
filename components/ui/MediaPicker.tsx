"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { Upload, Library, X, Loader2, Search } from "lucide-react";
import { listMediaForPickerAction, finalizeMediaAction } from "@/lib/actions/media";

type MediaRow = {
  id: string;
  url: string;
  alt: string;
  mime: string;
  width: number | null;
  height: number | null;
};

type Mode = "library" | "upload";

/**
 * Like ImagePicker, but returns a Media row (id + url) instead of a
 * bare URL. Use this anywhere a schema column is a FK to Media.id —
 * Post.coverMediaId, Program.coverMediaId, Event.coverMediaId, etc.
 *
 * No URL tab: external URLs can't be mapped to a Media row.
 */
export function MediaPicker({
  value,
  valueUrl,
  onChange,
  placeholder = "Cover image",
  aspect = "16/9",
}: {
  value: string | null | undefined;
  valueUrl: string | null | undefined;
  onChange: (picked: { id: string; url: string } | null) => void;
  placeholder?: string;
  aspect?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      {value && valueUrl ? (
        <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-muted)]">
          <div className="relative w-full" style={{ aspectRatio: aspect }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={valueUrl} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="absolute right-2 top-2 flex gap-1">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white hover:bg-black/80"
            >
              Change
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
              aria-label="Remove"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-border)] bg-[rgb(var(--token-muted)/0.30)] p-8 text-sm text-[var(--color-muted-fg)] transition hover:border-[var(--color-primary)] hover:bg-[rgb(var(--token-muted)/0.50)]"
          style={{ aspectRatio: aspect }}
        >
          <Upload className="h-6 w-6" />
          <span>Select {placeholder.toLowerCase()}</span>
        </button>
      )}

      {open && (
        <MediaPickerDialog
          onPick={(picked) => {
            onChange(picked);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function MediaPickerDialog({
  onPick,
  onClose,
}: {
  onPick: (picked: { id: string; url: string }) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>("library");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      role="presentation"
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div
        className="flex h-[80dvh] w-full max-w-4xl flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <header className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
          <div className="flex gap-1 text-sm">
            <TabButton active={mode === "library"} onClick={() => setMode("library")}>
              <Library className="h-4 w-4" /> Library
            </TabButton>
            <TabButton active={mode === "upload"} onClick={() => setMode("upload")}>
              <Upload className="h-4 w-4" /> Upload
            </TabButton>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-[var(--color-muted-fg)] hover:bg-[var(--color-muted)]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {mode === "library" ? <LibraryTab onPick={onPick} /> : <UploadTab onPick={onPick} />}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-1.5 text-sm " +
        (active
          ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)]"
          : "text-[var(--color-muted-fg)] hover:bg-[var(--color-muted)]")
      }
    >
      {children}
    </button>
  );
}

function LibraryTab({ onPick }: { onPick: (picked: { id: string; url: string }) => void }) {
  const [rows, setRows] = useState<MediaRow[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    listMediaForPickerAction({ take: 120 })
      .then((data) => setRows(data as MediaRow[]))
      .catch(() => setRows([]));
  }, []);

  if (rows === null) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted-fg)]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  const filtered = query
    ? rows.filter(
        (r) =>
          r.alt.toLowerCase().includes(query.toLowerCase()) ||
          r.url.toLowerCase().includes(query.toLowerCase()),
      )
    : rows;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-fg)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by alt text or URL…"
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>
      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-[var(--color-muted-fg)]">
          {rows.length === 0
            ? "No images in the library yet. Upload one to start."
            : "No images match that search."}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {filtered.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onPick({ id: m.id, url: m.url })}
              className="group relative aspect-square overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)] transition hover:ring-2 hover:ring-[var(--color-primary)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt={m.alt} className="h-full w-full object-cover transition group-hover:scale-105" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UploadTab({ onPick }: { onPick: (picked: { id: string; url: string }) => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    try {
      const presignRes = await fetch("/api/media/presign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: file.name, mime: file.type, size: file.size }),
      });
      if (!presignRes.ok) {
        const body = await presignRes.json().catch(() => ({}));
        throw new Error(body.error ?? `Presign failed: ${presignRes.status}`);
      }
      const { key, uploadUrl, publicUrl } = (await presignRes.json()) as {
        key: string;
        uploadUrl: string;
        publicUrl: string;
      };

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error(`Upload failed: ${putRes.status}`);

      let width: number | undefined;
      let height: number | undefined;
      try {
        const dims = await readImageDims(file);
        width = dims.width;
        height = dims.height;
      } catch {
        /* optional */
      }
      const row = await finalizeMediaAction({
        key,
        mime: file.type,
        sizeBytes: file.size,
        width,
        height,
        alt: "",
      });
      onPick({ id: row.id, url: publicUrl });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <label
        className={
          "flex w-full max-w-md cursor-pointer flex-col items-center gap-3 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-border)] bg-[rgb(var(--token-muted)/0.30)] p-10 text-center text-sm transition hover:border-[var(--color-primary)] hover:bg-[rgb(var(--token-muted)/0.50)] " +
          (isPending ? "pointer-events-none opacity-50" : "")
        }
      >
        {isPending ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
            <span>Uploading…</span>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-[var(--color-muted-fg)]" />
            <span className="font-medium">Click to select a file</span>
            <span className="text-xs text-[var(--color-muted-fg)]">PNG, JPG, WebP, SVG — up to 10 MB.</span>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) startTransition(() => handleFile(f));
          }}
        />
      </label>
      {error ? <p className="mt-3 text-sm text-[var(--color-danger)]">Upload failed: {error}</p> : null}
    </div>
  );
}

function readImageDims(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("failed to read image dimensions"));
    };
    img.src = url;
  });
}
