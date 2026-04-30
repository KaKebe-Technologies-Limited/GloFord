"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Trash2, Users, Heart } from "lucide-react";
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
  createVolunteerAction,
  updateVolunteerAction,
  deleteVolunteerAction,
  toggleVolunteerAction,
} from "./actions";

type Opportunity = {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  commitment: string;
  description: string;
  requirements: string[];
  benefits: string[];
  isActive: boolean;
  _count: { applications: number };
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function VolunteerClient({
  opportunities,
}: {
  opportunities: Opportunity[];
}) {
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [autoSlug, setAutoSlug] = useState("");
  const router = useRouter();

  function openCreate() {
    setEditing(null);
    setAutoSlug("");
    setShowForm(true);
  }

  function openEdit(o: Opportunity) {
    setEditing(o);
    setAutoSlug(o.slug);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setAutoSlug("");
  }

  async function handleSubmit(formData: FormData) {
    if (editing) {
      formData.set("id", editing.id);
      await updateVolunteerAction(formData);
    } else {
      await createVolunteerAction(formData);
    }
    closeForm();
    router.refresh();
  }

  async function handleDelete(formData: FormData) {
    await deleteVolunteerAction(formData);
    router.refresh();
  }

  async function handleToggle(formData: FormData) {
    await toggleVolunteerAction(formData);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Volunteer Opportunities
          </h1>
          <p className="text-sm text-[var(--color-muted-fg)]">
            Manage volunteer positions and review applications.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Opportunity
        </Button>
      </header>

      {showForm && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <h2 className="mb-4 text-lg font-semibold">
            {editing ? "Edit Opportunity" : "New Opportunity"}
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
                  onChange={(e) => {
                    if (!editing) setAutoSlug(slugify(e.target.value));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  name="slug"
                  value={autoSlug}
                  onChange={(e) => setAutoSlug(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Input
                  id="department"
                  name="department"
                  required
                  defaultValue={editing?.department ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  name="location"
                  required
                  defaultValue={editing?.location ?? ""}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="commitment">Commitment *</Label>
                <Input
                  id="commitment"
                  name="commitment"
                  required
                  defaultValue={editing?.commitment ?? ""}
                  placeholder="e.g. 10 hours/week, 3 months"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                defaultValue={editing?.description ?? ""}
                className="flex w-full rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm placeholder:text-[var(--color-muted-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="requirements">
                  Requirements (one per line)
                </Label>
                <textarea
                  id="requirements"
                  name="requirements"
                  rows={4}
                  defaultValue={editing?.requirements?.join("\n") ?? ""}
                  className="flex w-full rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm placeholder:text-[var(--color-muted-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="benefits">Benefits (one per line)</Label>
                <textarea
                  id="benefits"
                  name="benefits"
                  rows={4}
                  defaultValue={editing?.benefits?.join("\n") ?? ""}
                  className="flex w-full rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm placeholder:text-[var(--color-muted-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
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
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Commitment</th>
                <th className="px-4 py-3">Applications</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {opportunities.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-[var(--color-muted-fg)]"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Heart className="h-8 w-8" />
                      No opportunities yet. Add one to get started.
                    </div>
                  </td>
                </tr>
              ) : (
                opportunities.map((o) => (
                  <tr key={o.id} className="group hover:bg-[rgb(var(--token-muted)/0.50)]">
                    <td className="px-4 py-3 font-medium">{o.title}</td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                      {o.department}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                      {o.location}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                      {o.commitment}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/volunteer/${o.id}/applications`}
                        className="inline-flex items-center gap-1 text-[var(--color-primary)] hover:underline"
                      >
                        <Users className="h-3.5 w-3.5" />
                        {o._count.applications}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <form action={handleToggle}>
                        <input type="hidden" name="id" value={o.id} />
                        <input
                          type="hidden"
                          name="isActive"
                          value={String(o.isActive)}
                        />
                        <button
                          type="submit"
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            o.isActive
                              ? "bg-[rgb(var(--token-success)/0.20)] text-[var(--color-success)]"
                              : "bg-[var(--color-muted)] text-[var(--color-muted-fg)]"
                          }`}
                        >
                          {o.isActive ? "Active" : "Inactive"}
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(o)}
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
                                Delete opportunity
                              </ConfirmDialogTitle>
                              <ConfirmDialogDescription>
                                Are you sure you want to delete &quot;{o.title}
                                &quot;? All associated applications will also be
                                removed. This action cannot be undone.
                              </ConfirmDialogDescription>
                            </ConfirmDialogHeader>
                            <ConfirmDialogFooter>
                              <ConfirmDialogCancel>Cancel</ConfirmDialogCancel>
                              <form action={handleDelete}>
                                <input type="hidden" name="id" value={o.id} />
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
