"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { finalizeMediaAction } from "@/lib/actions/media";
import { Button } from "@/components/ui/Button";

export function MediaUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ name: string; status: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    setError(null);
    setProgress({ name: file.name, status: "Requesting upload URL\u2026" });
    try {
      const presignRes = await fetch("/api/media/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, mime: file.type, size: file.size }),
      });
      if (!presignRes.ok) throw new Error((await presignRes.json()).error ?? "Presign failed");
      const { key, uploadUrl } = (await presignRes.json()) as { key: string; uploadUrl: string };

      setProgress({ name: file.name, status: "Uploading\u2026" });
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload to storage failed");

      const dims = file.type.startsWith("image/") ? await readImageDimensions(file) : undefined;
      setProgress({ name: file.name, status: "Saving\u2026" });
      await finalizeMediaAction({
        key,
        mime: file.type,
        sizeBytes: file.size,
        width: dims?.width,
        height: dims?.height,
      });
      setProgress(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setProgress(null);
    }
  };

  return (
    <div className="rounded-[--radius-lg] border border-dashed border-[--color-border] bg-[--color-muted]/40 p-6">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">Upload media</p>
          <p className="text-sm text-[--color-muted-fg]">Images or PDFs, up to 25 MB each.</p>
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
        <p className="mt-3 text-sm text-[--color-muted-fg]">
          {progress.name}: {progress.status}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 text-sm text-[--color-danger]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read image"));
    };
    img.src = url;
  });
}
