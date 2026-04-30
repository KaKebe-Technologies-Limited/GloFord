"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
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
import {
  createHeroSlideAction,
  updateHeroSlideAction,
  deleteHeroSlideAction,
  toggleHeroSlideAction,
} from "./actions";

type Slide = {
  id: string;
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  imageUrl: string;
  imageAlt: string | null;
  durationMs: number;
  order: number;
  isActive: boolean;
};

export function HeroSlidesClient({ slides }: { slides: Slide[] }) {
  const [editing, setEditing] = useState<Slide | null>(null);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(slide: Slide) {
    setEditing(slide);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  async function handleSubmit(formData: FormData) {
    if (editing) {
      formData.set("id", editing.id);
      await updateHeroSlideAction(formData);
    } else {
      await createHeroSlideAction(formData);
    }
    closeForm();
    router.refresh();
  }

  async function handleDelete(formData: FormData) {
    await deleteHeroSlideAction(formData);
    router.refresh();
  }

  async function handleToggle(formData: FormData) {
    await toggleHeroSlideAction(formData);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hero Slides</h1>
          <p className="text-sm text-[var(--color-muted-fg)]">
            Manage the homepage hero carousel slides.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Slide
        </Button>
      </header>

      {/* Form modal */}
      {showForm && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <h2 className="mb-4 text-lg font-semibold">
            {editing ? "Edit Slide" : "New Slide"}
          </h2>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  defaultValue={editing?.title ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  name="subtitle"
                  defaultValue={editing?.subtitle ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL *</Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  required
                  defaultValue={editing?.imageUrl ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageAlt">Image Alt Text</Label>
                <Input
                  id="imageAlt"
                  name="imageAlt"
                  defaultValue={editing?.imageAlt ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ctaLabel">CTA Label</Label>
                <Input
                  id="ctaLabel"
                  name="ctaLabel"
                  defaultValue={editing?.ctaLabel ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ctaHref">CTA Link</Label>
                <Input
                  id="ctaHref"
                  name="ctaHref"
                  defaultValue={editing?.ctaHref ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="durationSeconds">Duration (seconds)</Label>
                <Input
                  id="durationSeconds"
                  name="durationSeconds"
                  type="number"
                  min={1}
                  max={30}
                  defaultValue={editing ? editing.durationMs / 1000 : 5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">Order</Label>
                <Input
                  id="order"
                  name="order"
                  type="number"
                  min={0}
                  defaultValue={editing?.order ?? 0}
                />
              </div>
            </div>

            {editing && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  defaultChecked={editing.isActive}
                  className="h-4 w-4 rounded border-[var(--color-border)]"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            )}

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

      {/* Table */}
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[rgb(var(--token-muted)/0.50)] text-left text-xs uppercase tracking-wider text-[var(--color-muted-fg)]">
              <tr>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {slides.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-[var(--color-muted-fg)]"
                  >
                    No slides yet. Add one to get started.
                  </td>
                </tr>
              ) : (
                slides.map((slide) => (
                  <tr key={slide.id} className="group hover:bg-[rgb(var(--token-muted)/0.50)]">
                    <td className="px-4 py-3">
                      {slide.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={slide.imageUrl}
                          alt={slide.imageAlt ?? slide.title}
                          className="h-10 w-16 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-16 items-center justify-center rounded bg-[var(--color-muted)]">
                          <ImageIcon className="h-4 w-4 text-[var(--color-muted-fg)]" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{slide.title}</td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                      {slide.durationMs / 1000}s
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                      {slide.order}
                    </td>
                    <td className="px-4 py-3">
                      <form action={handleToggle}>
                        <input type="hidden" name="id" value={slide.id} />
                        <input
                          type="hidden"
                          name="isActive"
                          value={String(slide.isActive)}
                        />
                        <button
                          type="submit"
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            slide.isActive
                              ? "bg-[rgb(var(--token-success)/0.20)] text-[var(--color-success)]"
                              : "bg-[var(--color-muted)] text-[var(--color-muted-fg)]"
                          }`}
                        >
                          {slide.isActive ? "Active" : "Inactive"}
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(slide)}
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
                              <ConfirmDialogTitle>Delete slide</ConfirmDialogTitle>
                              <ConfirmDialogDescription>
                                Are you sure you want to delete &quot;{slide.title}
                                &quot;? This action cannot be undone.
                              </ConfirmDialogDescription>
                            </ConfirmDialogHeader>
                            <ConfirmDialogFooter>
                              <ConfirmDialogCancel>Cancel</ConfirmDialogCancel>
                              <form action={handleDelete}>
                                <input type="hidden" name="id" value={slide.id} />
                                <ConfirmDialogAction type="submit">
                                  Delete
                                </ConfirmDialogAction>
                              </form>
                            </ConfirmDialogFooter>
                          </ConfirmDialogContent>
                        </ConfirmDialog>
                      </div>
                    </td>
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
