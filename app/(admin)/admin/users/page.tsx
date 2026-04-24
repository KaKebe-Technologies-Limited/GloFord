import { requireActorFromSession } from "@/lib/auth-context";
import { listOrgUsers } from "@/lib/services/users";
import { UserManager } from "./UserManager";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  const actor = await requireActorFromSession();
  const rows = await listOrgUsers();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-[--color-muted-fg]">
          Manage members of this organization and their roles.
        </p>
      </header>

      <UserManager
        currentUserId={actor.userId}
        members={rows.map((u) => ({
          id: u.id,
          userId: u.id,
          email: u.email,
          name: u.name ?? "",
          role: u.role?.name ?? "VIEWER",
          joinedAt: u.createdAt.toLocaleDateString(),
          lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toLocaleString() : null,
          isActive: u.isActive,
        }))}
      />
    </div>
  );
}
