"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Trash2, Users, Briefcase } from "lucide-react";
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
  createCareerAction,
  updateCareerAction,
  deleteCareerAction,
  toggleCareerAction,
} from "./actions";

const JOB_TYPES = [
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERNSHIP", label: "Internship" },
  { value: "VOLUNTEER", label: "Volunteer" },
] as const;

type Career = {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  salaryRange: string | null;
  applicationDeadline: Date | string | null;
  isActive: boolean;
  _count: { applications: number };
};

export function CareersClient({ careers }: { careers: Career[] }) {
  const [editing, setEditing] = useState<Career | null>(null);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(c: Career) {
    setEditing(c);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  async function handleSubmit(formData: FormData) {
    if (editing) {
      formData.set("id", editing.id);
      await updateCareerAction(formData);
    } else {
      await createCareerAction(formData);
    }
    closeForm();
    router.refresh();
  }

  async function handleDelete(formData: FormData) {
    await deleteCareerAction(formData);
    router.refresh();
  }

  async function handleToggle(formData: FormData) {
    await toggleCareerAction(formData);
    router.refresh();
  }

  function formatDate(d: Date | string | null): string {
    if (!d) return "";
    return new Date(d).toISOString().split("T")[0] ?? "";
  }

  function formatTypeLabel(type: string): string {
    return JOB_TYPES.find((t) => t.value === type)?.label ?? type;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Careers</h1>
          <p className="text-sm text-[var(--color-muted-fg)]">
            Manage job listings and review applications.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Position
        </Button>
      </header>

      {showForm && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <h2 className="mb-4 text-lg font-semibold">
            {editing ? "Edit Position" : "New Position"}
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
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  name="type"
                  defaultValue={editing?.type ?? "FULL_TIME"}
                  className="flex h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                >
                  {JOB_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryRange">Salary Range</Label>
                <Input
                  id="salaryRange"
                  name="salaryRange"
                  defaultValue={editing?.salaryRange ?? ""}
                  placeholder="e.g. $60,000 - $80,000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="applicationDeadline">Application Deadline</Label>
                <Input
                  id="applicationDeadline"
                  name="applicationDeadline"
                  type="date"
                  defaultValue={editing ? formatDate(editing.applicationDeadline) : ""}
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
                <Label htmlFor="requirements">Requirements (one per line)</Label>
                <textarea
                  id="requirements"
                  name="requirements"
                  rows={4}
                  defaultValue={editing?.requirements?.join("\n") ?? ""}
                  className="flex w-full rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm placeholder:text-[var(--color-muted-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsibilities">
                  Responsibilities (one per line)
                </Label>
                <textarea
                  id="responsibilities"
                  name="responsibilities"
                  rows={4}
                  defaultValue={editing?.responsibilities?.join("\n") ?? ""}
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
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3">Applications</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {careers.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-[var(--color-muted-fg)]"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Briefcase className="h-8 w-8" />
                      No positions yet. Add one to get started.
                    </div>
                  </td>
                </tr>
              ) : (
                careers.map((c) => (
                  <tr key={c.id} className="group hover:bg-[rgb(var(--token-muted)/0.50)]">
                    <td className="px-4 py-3 font-medium">{c.title}</td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                      {c.department}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                      {c.location}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-[var(--color-muted)] px-2.5 py-0.5 text-xs font-medium">
                        {formatTypeLabel(c.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                      {c.applicationDeadline
                        ? new Date(c.applicationDeadline).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/careers/${c.id}/applications`}
                        className="inline-flex items-center gap-1 text-[var(--color-primary)] hover:underline"
                      >
                        <Users className="h-3.5 w-3.5" />
                        {c._count.applications}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <form action={handleToggle}>
                        <input type="hidden" name="id" value={c.id} />
                        <input
                          type="hidden"
                          name="isActive"
                          value={String(c.isActive)}
                        />
                        <button
                          type="submit"
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            c.isActive
                              ? "bg-[rgb(var(--token-success)/0.20)] text-[var(--color-success)]"
                              : "bg-[var(--color-muted)] text-[var(--color-muted-fg)]"
                          }`}
                        >
                          {c.isActive ? "Active" : "Inactive"}
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(c)}
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
                                Delete position
                              </ConfirmDialogTitle>
                              <ConfirmDialogDescription>
                                Are you sure you want to delete &quot;{c.title}
                                &quot;? All associated applications will also be
                                removed. This action cannot be undone.
                              </ConfirmDialogDescription>
                            </ConfirmDialogHeader>
                            <ConfirmDialogFooter>
                              <ConfirmDialogCancel>Cancel</ConfirmDialogCancel>
                              <form action={handleDelete}>
                                <input type="hidden" name="id" value={c.id} />
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
