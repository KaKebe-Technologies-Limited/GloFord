"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
  createLeaderMessageAction,
  updateLeaderMessageAction,
  deleteLeaderMessageAction,
  toggleLeaderMessageAction,
} from "./actions";

type LeaderMessage = {
  id: string;
  leaderName: string;
  title: string;
  role: string;
  photoUrl: string | null;
  message: string;
  signature: string | null;
  order: number;
  isActive: boolean;
};

export function LeaderMessagesClient({
  messages,
}: {
  messages: LeaderMessage[];
}) {
  const [editing, setEditing] = useState<LeaderMessage | null>(null);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(m: LeaderMessage) {
    setEditing(m);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  async function handleSubmit(formData: FormData) {
    if (editing) {
      formData.set("id", editing.id);
      await updateLeaderMessageAction(formData);
    } else {
      await createLeaderMessageAction(formData);
    }
    closeForm();
    router.refresh();
  }

  async function handleDelete(formData: FormData) {
    await deleteLeaderMessageAction(formData);
    router.refresh();
  }

  async function handleToggle(formData: FormData) {
    await toggleLeaderMessageAction(formData);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Leader Messages
          </h1>
          <p className="text-sm text-[var(--color-muted-fg)]">
            Manage messages from organizational leaders.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Message
        </Button>
      </header>

      {showForm && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <h2 className="mb-4 text-lg font-semibold">
            {editing ? "Edit Message" : "New Message"}
          </h2>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="leaderName">Leader Name *</Label>
                <Input
                  id="leaderName"
                  name="leaderName"
                  required
                  defaultValue={editing?.leaderName ?? ""}
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
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Input
                  id="role"
                  name="role"
                  required
                  defaultValue={editing?.role ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="photoUrl">Photo URL</Label>
                <Input
                  id="photoUrl"
                  name="photoUrl"
                  defaultValue={editing?.photoUrl ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signature">Signature</Label>
                <Input
                  id="signature"
                  name="signature"
                  defaultValue={editing?.signature ?? ""}
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

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                defaultValue={editing?.message ?? ""}
                className="flex w-full rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm placeholder:text-[var(--color-muted-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              />
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
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {messages.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-[var(--color-muted-fg)]"
                  >
                    No leader messages yet.
                  </td>
                </tr>
              ) : (
                messages.map((m) => (
                  <tr key={m.id} className="group hover:bg-[rgb(var(--token-muted)/0.50)]">
                    <td className="px-4 py-3 font-medium">{m.leaderName}</td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                      {m.role}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                      {m.title}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                      {m.order}
                    </td>
                    <td className="px-4 py-3">
                      <form action={handleToggle}>
                        <input type="hidden" name="id" value={m.id} />
                        <input
                          type="hidden"
                          name="isActive"
                          value={String(m.isActive)}
                        />
                        <button
                          type="submit"
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            m.isActive
                              ? "bg-[rgb(var(--token-success)/0.20)] text-[var(--color-success)]"
                              : "bg-[var(--color-muted)] text-[var(--color-muted-fg)]"
                          }`}
                        >
                          {m.isActive ? "Active" : "Inactive"}
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(m)}
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
                                Delete message
                              </ConfirmDialogTitle>
                              <ConfirmDialogDescription>
                                Are you sure you want to delete the message from
                                &quot;{m.leaderName}&quot;? This action cannot be
                                undone.
                              </ConfirmDialogDescription>
                            </ConfirmDialogHeader>
                            <ConfirmDialogFooter>
                              <ConfirmDialogCancel>Cancel</ConfirmDialogCancel>
                              <form action={handleDelete}>
                                <input type="hidden" name="id" value={m.id} />
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
