"use client";

import { useState, useTransition } from "react";
import { UserPlus, UserMinus } from "lucide-react";
import {
  inviteUserAction,
  updateUserRoleAction,
  deactivateUserAction,
} from "@/lib/actions/users";
import { Button } from "@/components/ui/Button";

type Role = "ADMIN" | "EDITOR" | "VIEWER";

type Member = {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  joinedAt: string;
  lastLoginAt: string | null;
  isActive: boolean;
};

export function UserManager({
  currentUserId,
  members,
}: {
  currentUserId: string;
  members: Member[];
}) {
  const [invite, setInvite] = useState({ email: "", name: "", role: "EDITOR" as Role });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const doInvite = () => {
    if (!invite.email.trim()) return;
    setError(null);
    start(async () => {
      try {
        await inviteUserAction({
          email: invite.email.trim(),
          name: invite.name.trim() || undefined,
          role: invite.role,
        });
        setInvite({ email: "", name: "", role: "EDITOR" });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to invite");
      }
    });
  };

  const changeRole = (userId: string, role: Role) => {
    start(async () => {
      try {
        await updateUserRoleAction({ userId, role });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update role");
      }
    });
  };

  const remove = (userId: string) => {
    if (!confirm("Remove this user from the organization?")) return;
    start(async () => {
      try {
        await deactivateUserAction({ userId });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to remove");
      }
    });
  };

  return (
    <div className="space-y-6">
      {error ? (
        <p
          role="alert"
          className="rounded-[var(--radius-sm)] bg-[rgb(var(--token-danger)/0.10)] p-3 text-sm text-[var(--color-danger)]"
        >
          {error}
        </p>
      ) : null}

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <h2 className="text-sm font-semibold">Invite a member</h2>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_140px_auto]">
          <input
            type="email"
            value={invite.email}
            onChange={(e) => setInvite((d) => ({ ...d, email: e.target.value }))}
            placeholder="name@example.com"
            className={inputCls}
          />
          <input
            value={invite.name}
            onChange={(e) => setInvite((d) => ({ ...d, name: e.target.value }))}
            placeholder="Full name (optional)"
            className={inputCls}
          />
          <select
            value={invite.role}
            onChange={(e) => setInvite((d) => ({ ...d, role: e.target.value as Role }))}
            className={inputCls}
          >
            <option value="ADMIN">Admin</option>
            <option value="EDITOR">Editor</option>
            <option value="VIEWER">Viewer</option>
          </select>
          <Button onClick={doInvite} disabled={pending || !invite.email.trim()}>
            <UserPlus className="h-4 w-4" /> Invite
          </Button>
        </div>
      </section>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[rgb(var(--token-muted)/0.50)] text-left text-xs uppercase tracking-wider text-[var(--color-muted-fg)]">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Last login</th>
              <th className="px-4 py-3 w-0">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const isSelf = m.userId === currentUserId;
              return (
                <tr key={m.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{m.name || m.email}</div>
                    <div className="text-xs text-[var(--color-muted-fg)]">{m.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {m.role === "SUPER_ADMIN" ? (
                      <span className="inline-flex items-center rounded-full bg-[rgb(var(--token-primary)/0.10)] px-2 py-0.5 text-xs text-[var(--color-primary)]">
                        Super admin
                      </span>
                    ) : (
                      <select
                        defaultValue={m.role}
                        onChange={(e) => changeRole(m.userId, e.target.value as Role)}
                        disabled={pending || isSelf}
                        className="rounded-[var(--radius-sm)] border border-[var(--color-input)] bg-[var(--color-bg)] px-2 py-1 text-sm"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="EDITOR">Editor</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted-fg)]">{m.joinedAt}</td>
                  <td className="px-4 py-3 text-[var(--color-muted-fg)]">{m.lastLoginAt ?? "—"}</td>
                  <td className="px-4 py-3">
                    {isSelf ? (
                      <span className="text-xs text-[var(--color-muted-fg)]">You</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => remove(m.userId)}
                        disabled={pending}
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]";
