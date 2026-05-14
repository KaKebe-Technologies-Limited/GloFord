"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, ImageIcon } from "lucide-react";
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
import {
  createMilestoneAction,
  updateMilestoneAction,
  deleteMilestoneAction,
  toggleMilestoneAction,
} from "./actions";

type Milestone = {
  id: string;
  year: string;
  title: string;
  description: string;
  imageUrl: string | null;
  order: number;
  isActive: boolean;
};

export function MilestonesClient({ milestones }: { milestones: Milestone[] }) {
  const [editing, setEditing] = useState<Milestone | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function openCreate() {
    setEditing(null);
    setImageUrl(null);
    setShowForm(true);
  }

  function openEdit(milestone: Milestone) {
    setEditing(milestone);
    setImageUrl(milestone.imageUrl);
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
      if (editing) {
        formData.set("id", editing.id);
        await updateMilestoneAction(formData);
      } else {
        await createMilestoneAction(formData);
      }
      closeForm();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  async function handleToggle(formData: FormData) {
    setError(null);
    try {
      await toggleMilestoneAction(formData);
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
          <h1 className="text-2xl font-semibold tracking-tight">Milestones</h1>
          <p className="text-sm text-[var(--color-muted-fg)]">
            Manage the timeline milestones displayed on the About page.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Milestone
        </Button>
      </header>

      {/* Form modal */}
      {showForm && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <h2 className="mb-4 text-lg font-semibold">
            {editing ? "Edit Milestone" : "New Milestone"}
          </h2>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  name="year"
                  required
                  defaultValue={editing?.year ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  defaultValue={editing?.title ?? ""}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={3}
                  defaultValue={editing?.description ?? ""}
                  className="flex w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm placeholder:text-[var(--color-muted-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Timeline Image</Label>
                <ImagePicker
                  value={imageUrl}
                  onChange={setImageUrl}
                  placeholder="Timeline image"
                  aspect="16/10"
                />
                <input type="hidden" name="imageUrl" value={imageUrl ?? ""} />
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
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {milestones.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-[var(--color-muted-fg)]"
                  >
                    No milestones yet. Add one to get started.
                  </td>
                </tr>
              ) : (
                milestones.map((milestone) => (
                  <tr key={milestone.id} className="group hover:bg-[rgb(var(--token-muted)/0.50)]">
                    <td className="px-4 py-3 font-medium">{milestone.year}</td>
                    <td className="px-4 py-3">{milestone.title}</td>
                    <td className="px-4 py-3">
                      {milestone.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={milestone.imageUrl}
                          alt={milestone.title}
                          className="h-10 w-16 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-16 items-center justify-center rounded bg-[var(--color-muted)]">
                          <ImageIcon className="h-4 w-4 text-[var(--color-muted-fg)]" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                      {milestone.order}
                    </td>
                    <td className="px-4 py-3">
                      <form action={handleToggle}>
                        <input type="hidden" name="id" value={milestone.id} />
                        <input
                          type="hidden"
                          name="isActive"
                          value={String(milestone.isActive)}
                        />
                        <button
                          type="submit"
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            milestone.isActive
                              ? "bg-[rgb(var(--token-success)/0.20)] text-[var(--color-success)]"
                              : "bg-[var(--color-muted)] text-[var(--color-muted-fg)]"
                          }`}
                        >
                          {milestone.isActive ? "Active" : "Inactive"}
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(milestone)}
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
                              <ConfirmDialogTitle>Delete milestone</ConfirmDialogTitle>
                              <ConfirmDialogDescription>
                                Are you sure you want to delete &quot;{milestone.title}
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
                                    fd.set("id", milestone.id);
                                    await deleteMilestoneAction(fd);
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
