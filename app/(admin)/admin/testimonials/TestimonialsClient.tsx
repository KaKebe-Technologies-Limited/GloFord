"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
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
  createTestimonialAction,
  updateTestimonialAction,
  deleteTestimonialAction,
  toggleTestimonialAction,
} from "./actions";

type Testimonial = {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string | null;
  authorOrg: string | null;
  avatarUrl: string | null;
  rating: number | null;
  order: number;
  isActive: boolean;
};

export function TestimonialsClient({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(t: Testimonial) {
    setEditing(t);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  async function handleSubmit(formData: FormData) {
    if (editing) {
      formData.set("id", editing.id);
      await updateTestimonialAction(formData);
    } else {
      await createTestimonialAction(formData);
    }
    closeForm();
    router.refresh();
  }

  async function handleDelete(formData: FormData) {
    await deleteTestimonialAction(formData);
    router.refresh();
  }

  async function handleToggle(formData: FormData) {
    await toggleTestimonialAction(formData);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Testimonials</h1>
          <p className="text-sm text-[var(--color-muted-fg)]">
            Manage testimonials displayed on the public site.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Testimonial
        </Button>
      </header>

      {showForm && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <h2 className="mb-4 text-lg font-semibold">
            {editing ? "Edit Testimonial" : "New Testimonial"}
          </h2>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quote">Quote *</Label>
              <textarea
                id="quote"
                name="quote"
                required
                rows={3}
                defaultValue={editing?.quote ?? ""}
                className="flex w-full rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm placeholder:text-[var(--color-muted-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="authorName">Author Name *</Label>
                <Input
                  id="authorName"
                  name="authorName"
                  required
                  defaultValue={editing?.authorName ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="authorRole">Role</Label>
                <Input
                  id="authorRole"
                  name="authorRole"
                  defaultValue={editing?.authorRole ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="authorOrg">Organization</Label>
                <Input
                  id="authorOrg"
                  name="authorOrg"
                  defaultValue={editing?.authorOrg ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatarUrl">Avatar URL</Label>
                <Input
                  id="avatarUrl"
                  name="avatarUrl"
                  defaultValue={editing?.avatarUrl ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">Rating (1-5)</Label>
                <Input
                  id="rating"
                  name="rating"
                  type="number"
                  min={1}
                  max={5}
                  defaultValue={editing?.rating ?? ""}
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

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[rgb(var(--token-muted)/0.50)] text-left text-xs uppercase tracking-wider text-[var(--color-muted-fg)]">
              <tr>
                <th className="px-4 py-3">Quote</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Org</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {testimonials.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-[var(--color-muted-fg)]"
                  >
                    No testimonials yet.
                  </td>
                </tr>
              ) : (
                testimonials.map((t) => (
                  <tr key={t.id} className="group hover:bg-[rgb(var(--token-muted)/0.50)]">
                    <td className="max-w-xs truncate px-4 py-3 font-medium">
                      {t.quote.length > 80
                        ? t.quote.slice(0, 80) + "..."
                        : t.quote}
                    </td>
                    <td className="px-4 py-3">{t.authorName}</td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                      {t.authorRole ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                      {t.authorOrg ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      {t.rating ? (
                        <span className="inline-flex items-center gap-0.5 text-amber-500">
                          <Star className="h-3 w-3 fill-current" />
                          {t.rating}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <form action={handleToggle}>
                        <input type="hidden" name="id" value={t.id} />
                        <input
                          type="hidden"
                          name="isActive"
                          value={String(t.isActive)}
                        />
                        <button
                          type="submit"
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            t.isActive
                              ? "bg-[rgb(var(--token-success)/0.20)] text-[var(--color-success)]"
                              : "bg-[var(--color-muted)] text-[var(--color-muted-fg)]"
                          }`}
                        >
                          {t.isActive ? "Active" : "Inactive"}
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(t)}
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
                              <ConfirmDialogTitle>
                                Delete testimonial
                              </ConfirmDialogTitle>
                              <ConfirmDialogDescription>
                                Are you sure you want to delete the testimonial from
                                &quot;{t.authorName}&quot;? This action cannot be
                                undone.
                              </ConfirmDialogDescription>
                            </ConfirmDialogHeader>
                            <ConfirmDialogFooter>
                              <ConfirmDialogCancel>Cancel</ConfirmDialogCancel>
                              <form action={handleDelete}>
                                <input type="hidden" name="id" value={t.id} />
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
