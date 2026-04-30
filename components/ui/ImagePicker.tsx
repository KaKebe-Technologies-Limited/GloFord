"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { Upload, Library, Link as LinkIcon, X, Loader2, Search } from "lucide-react";
import { listMediaForPickerAction, finalizeMediaAction } from "@/lib/actions/media";

type MediaRow = {
  id: string;
  url: string;
  alt: string;
  mime: string;
  width: number | null;
  height: number | null;
};

type Mode = "library" | "upload" | "url";

/**
 * Universal image picker. Three sources:
 *   • "library" — pick from existing Media rows (default).
 *   • "upload"  — file from the operator's device (presigned → R2 → finalize).
 *   • "url"     — paste an external URL (not uploaded; stored as a link).
 *
 * Controlled: the caller owns `value` + `onChange`. When a picture is
 * picked via library/upload, onChange receives the Media URL. For URL
 * mode it receives whatever the operator typed.
 *
 * Pass `placeholder` to rename the empty-state label (e.g. "Hero image").
 */
export function ImagePicker({
  value,
  onChange,
  placeholder = "Image",
  allowUrl = true,
  allowUpload = true,
  allowLibrary = true,
  aspect = "16/9",
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  placeholder?: string;
  allowUrl?: boolean;
  allowUpload?: boolean;
  allowLibrary?: boolean;
  aspect?: string;
}) {
  const [open, setOpen] = useState(false);
  const defaultMode: Mode = allowLibrary ? "library" : allowUpload ? "upload" : "url";
  const [mode, setMode] = useState<Mode>(defaultMode);

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-muted)]">
          <div className="relative w-full" style={{ aspectRatio: aspect }}>
            {/* Use native img so external URLs work without next/image domain allowlist */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-full w-full object-cover" />
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
              aria-label="Remove image"
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
        <ImagePickerDialog
          mode={mode}
          setMode={setMode}
          allowUrl={allowUrl}
          allowUpload={allowUpload}
          allowLibrary={allowLibrary}
          onPick={(url) => {
            onChange(url);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function ImagePickerDialog({
  mode,
  setMode,
  allowUrl,
  allowUpload,
  allowLibrary,
  onPick,
  onClose,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
  allowUrl: boolean;
  allowUpload: boolean;
  allowLibrary: boolean;
  onPick: (url: string) => void;
  onClose: () => void;
}) {
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
            {allowLibrary && (
              <TabButton active={mode === "library"} onClick={() => setMode("library")}>
                <Library className="h-4 w-4" /> Library
              </TabButton>
            )}
            {allowUpload && (
              <TabButton active={mode === "upload"} onClick={() => setMode("upload")}>
                <Upload className="h-4 w-4" /> Upload
              </TabButton>
            )}
            {allowUrl && (
              <TabButton active={mode === "url"} onClick={() => setMode("url")}>
                <LinkIcon className="h-4 w-4" /> URL
              </TabButton>
            )}
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
          {mode === "library" && <LibraryTab onPick={onPick} />}
          {mode === "upload" && <UploadTab onPick={onPick} />}
          {mode === "url" && <UrlTab onPick={onPick} />}
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

function LibraryTab({ onPick }: { onPick: (url: string) => void }) {
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
    ? rows.filter((r) => r.alt.toLowerCase().includes(query.toLowerCase()) || r.url.toLowerCase().includes(query.toLowerCase()))
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
            ? "No images in the library yet. Upload one or paste a URL."
            : "No images match that search."}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {filtered.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onPick(m.url)}
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

function UploadTab({ onPick }: { onPick: (url: string) => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    try {
      // 1. Ask server for a presigned URL.
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

      // 2. PUT the file directly to R2/S3.
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error(`Upload failed: ${putRes.status}`);

      // 3. Finalize: create the Media row server-side.
      let width: number | undefined;
      let height: number | undefined;
      try {
        const dims = await readImageDims(file);
        width = dims.width;
        height = dims.height;
      } catch {
        /* ignore — dimensions are optional */
      }
      await finalizeMediaAction({
        key,
        mime: file.type,
        sizeBytes: file.size,
        width,
        height,
        alt: "",
      });

      onPick(publicUrl);
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
            <span className="text-xs text-[var(--color-muted-fg)]">
              PNG, JPG, WebP, SVG — up to 10 MB.
            </span>
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

      {error ? (
        <p className="mt-3 text-sm text-[var(--color-danger)]">
          Upload failed: {error}. You can still paste a URL instead.
        </p>
      ) : null}
    </div>
  );
}

function UrlTab({ onPick }: { onPick: (url: string) => void }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const ok = (() => {
    try {
      const u = new URL(url);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  })();

  function submit() {
    if (!ok) {
      setError("Please enter a valid http:// or https:// URL.");
      return;
    }
    onPick(url.trim());
  }

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-3">
        <label className="block text-sm font-medium" htmlFor="image-picker-url">
          Image URL
        </label>
        <input
          id="image-picker-url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="https://example.com/image.jpg"
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
        {url && ok ? (
          <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-48 w-full object-cover" />
          </div>
        ) : null}
        {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
        <button
          type="button"
          onClick={submit}
          disabled={!ok}
          className="w-full rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-fg)] disabled:opacity-50"
        >
          Use this image
        </button>
        <p className="text-xs text-[var(--color-muted-fg)]">
          External URLs are stored as-is. If the source goes down, the image breaks.
          Prefer Upload for permanence.
        </p>
      </div>
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
