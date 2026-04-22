import { requireActorFromSession } from "@/lib/auth-context";
import { listOrgUsers } from "@/lib/services/users";
import { UserManager } from "./UserManager";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  const actor = await requireActorFromSession();
  const rows = await listOrgUsers(actor.orgId);

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
        members={rows.map((m) => ({
          id: m.id,
          userId: m.userId,
          email: m.user.email,
          name: m.user.name ?? "",
          role: m.role.name,
          joinedAt: m.joinedAt.toLocaleDateString(),
          lastLoginAt: m.user.lastLoginAt
            ? m.user.lastLoginAt.toLocaleString()
            : null,
          isActive: m.user.isActive,
        }))}
      />
    </div>
  );
}
