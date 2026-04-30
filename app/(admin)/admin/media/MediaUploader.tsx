"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function MediaUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ name: string; status: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    setError(null);
    setProgress({ name: file.name, status: "Uploading\u2026" });
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/media/presign", { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed");
      setProgress(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setProgress(null);
    }
  };

  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[rgb(var(--token-muted)/0.40)] p-6">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">Upload media</p>
          <p className="text-sm text-[var(--color-muted-fg)]">Images or PDFs, up to 25 MB each.</p>
        </div>
        <Button type="button" size="sm" onClick={handlePick} disabled={!!progress}>
          <Upload className="h-4 w-4" /> Choose file
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml,application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = "";
          }}
        />
      </div>
      {progress ? (
        <p className="mt-3 text-sm text-[var(--color-muted-fg)]">
          {progress.name}: {progress.status}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
