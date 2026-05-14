"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ImageIcon, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { ImagePicker } from "@/components/ui/ImagePicker";
import {
  ConfirmDialog,
  ConfirmDialogTrigger,
  ConfirmDialogContent,
  ConfirmDialogHeader,
  ConfirmDialogTitle,
  ConfirmDialogDescription,
  ConfirmDialogFooter,
  ConfirmDialogAction,
  ConfirmDialogCancel,
} from "@/components/ui/ConfirmDialog";
import { upsertSiteImageAction, deleteSiteImageAction } from "./actions";

type SiteImage = {
  id: string;
  key: string;
  label: string;
  url: string;
  alt: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function SiteImagesClient({ images }: { images: SiteImage[] }) {
  const [editing, setEditing] = useState<SiteImage | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function openCreate() {
    setEditing(null);
    setImageUrl(null);
    setShowForm(true);
  }

  function openEdit(image: SiteImage) {
    setEditing(image);
    setImageUrl(image.url);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setImageUrl(null);
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    try {
      await upsertSiteImageAction(formData);
      closeForm();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="rounded-[var(--radius-md)] border border-[var(--color-danger)] bg-[rgb(var(--token-danger)/0.08)] p-3 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Site Images</h1>
          <p className="text-sm text-[var(--color-muted-fg)]">
            Manage key-value page images (heroes, backgrounds, etc.)
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Image
        </Button>
      </header>

      {/* Inline form */}
      {showForm && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <h2 className="mb-4 text-lg font-semibold">
            {editing ? "Edit Image" : "New Image"}
          </h2>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="key">Key *</Label>
                <Input
                  id="key"
                  name="key"
                  required
                  placeholder="e.g. who-we-are-hero"
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  title="Lowercase kebab-case (e.g. who-we-are-hero)"
                  defaultValue={editing?.key ?? ""}
                  readOnly={!!editing}
                  className={editing ? "opacity-60" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="label">Label *</Label>
                <Input
                  id="label"
                  name="label"
                  required
                  placeholder="e.g. Who We Are Hero Image"
                  defaultValue={editing?.label ?? ""}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Image *</Label>
                <ImagePicker
                  value={imageUrl}
                  onChange={setImageUrl}
                  placeholder="Site image"
                  aspect="16/9"
                />
                <input type="hidden" name="url" value={imageUrl ?? ""} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="alt">Alt Text</Label>
                <Input
                  id="alt"
                  name="alt"
                  placeholder="Descriptive alt text for accessibility"
                  defaultValue={editing?.alt ?? ""}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" size="sm">
                {editing ? "Update" : "Create"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={closeForm}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Image grid */}
      {images.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-10 text-center text-[var(--color-muted-fg)]">
          No site images yet. Add one to get started.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <div
              key={image.id}
              className="group overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] transition-shadow hover:shadow-md"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-[rgb(var(--token-muted)/0.50)]">
                {image.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image.url}
                    alt={image.alt ?? image.label}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-[var(--color-muted-fg)]" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <span className="mb-1 inline-block rounded-full bg-[rgb(var(--token-muted)/0.50)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-muted-fg)]">
                  {image.key}
                </span>
                <p className="mt-1 text-sm font-medium">{image.label}</p>
                {image.alt && (
                  <p className="mt-0.5 truncate text-xs text-[var(--color-muted-fg)]">
                    {image.alt}
                  </p>
                )}

                {/* Actions */}
                <div className="mt-3 flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(image)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <ConfirmDialog>
                    <ConfirmDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
                      </Button>
                    </ConfirmDialogTrigger>
                    <ConfirmDialogContent>
                      <ConfirmDialogHeader>
                        <ConfirmDialogTitle>Delete image</ConfirmDialogTitle>
                        <ConfirmDialogDescription>
                          Are you sure you want to delete &quot;{image.key}
                          &quot;? This action cannot be undone.
                        </ConfirmDialogDescription>
                      </ConfirmDialogHeader>
                      <ConfirmDialogFooter>
                        <ConfirmDialogCancel>Cancel</ConfirmDialogCancel>
                        <ConfirmDialogAction
                          onClick={async () => {
                            setError(null);
                            try {
                              const fd = new FormData();
                              fd.set("id", image.id);
                              await deleteSiteImageAction(fd);
                              router.refresh();
                            } catch (e) {
                              setError(e instanceof Error ? e.message : "Delete failed");
                            }
                          }}
                        >
                          Delete
                        </ConfirmDialogAction>
                      </ConfirmDialogFooter>
                    </ConfirmDialogContent>
                  </ConfirmDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
