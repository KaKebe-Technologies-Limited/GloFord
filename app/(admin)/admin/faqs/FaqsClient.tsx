"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, HelpCircle } from "lucide-react";
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
  createFaqAction,
  updateFaqAction,
  deleteFaqAction,
  toggleFaqAction,
} from "./actions";

type Faq = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  order: number;
  isActive: boolean;
};

export function FaqsClient({ faqs }: { faqs: Faq[] }) {
  const [editing, setEditing] = useState<Faq | null>(null);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(f: Faq) {
    setEditing(f);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  async function handleSubmit(formData: FormData) {
    if (editing) {
      formData.set("id", editing.id);
      await updateFaqAction(formData);
    } else {
      await createFaqAction(formData);
    }
    closeForm();
    router.refresh();
  }

  async function handleDelete(formData: FormData) {
    await deleteFaqAction(formData);
    router.refresh();
  }

  async function handleToggle(formData: FormData) {
    await toggleFaqAction(formData);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">FAQs</h1>
          <p className="text-sm text-[var(--color-muted-fg)]">
            Manage frequently asked questions.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add FAQ
        </Button>
      </header>

      {showForm && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <h2 className="mb-4 text-lg font-semibold">
            {editing ? "Edit FAQ" : "New FAQ"}
          </h2>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">Question *</Label>
              <Input
                id="question"
                name="question"
                required
                defaultValue={editing?.question ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="answer">Answer *</Label>
              <textarea
                id="answer"
                name="answer"
                required
                rows={4}
                defaultValue={editing?.answer ?? ""}
                className="flex w-full rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm placeholder:text-[var(--color-muted-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  name="category"
                  defaultValue={editing?.category ?? ""}
                  placeholder="e.g. General, Donations, Volunteering"
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
                <th className="px-4 py-3">Question</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {faqs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-[var(--color-muted-fg)]"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <HelpCircle className="h-8 w-8" />
                      No FAQs yet.
                    </div>
                  </td>
                </tr>
              ) : (
                faqs.map((f) => (
                  <tr key={f.id} className="group hover:bg-[rgb(var(--token-muted)/0.50)]">
                    <td className="max-w-sm truncate px-4 py-3 font-medium">
                      {f.question.length > 80
                        ? f.question.slice(0, 80) + "..."
                        : f.question}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                      {f.category ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                      {f.order}
                    </td>
                    <td className="px-4 py-3">
                      <form action={handleToggle}>
                        <input type="hidden" name="id" value={f.id} />
                        <input
                          type="hidden"
                          name="isActive"
                          value={String(f.isActive)}
                        />
                        <button
                          type="submit"
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            f.isActive
                              ? "bg-[rgb(var(--token-success)/0.20)] text-[var(--color-success)]"
                              : "bg-[var(--color-muted)] text-[var(--color-muted-fg)]"
                          }`}
                        >
                          {f.isActive ? "Active" : "Inactive"}
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(f)}
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
                              <ConfirmDialogTitle>Delete FAQ</ConfirmDialogTitle>
                              <ConfirmDialogDescription>
                                Are you sure you want to delete this FAQ? This
                                action cannot be undone.
                              </ConfirmDialogDescription>
                            </ConfirmDialogHeader>
                            <ConfirmDialogFooter>
                              <ConfirmDialogCancel>Cancel</ConfirmDialogCancel>
                              <form action={handleDelete}>
                                <input type="hidden" name="id" value={f.id} />
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
