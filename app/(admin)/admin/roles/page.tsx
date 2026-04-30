import { requireActorFromSession } from "@/lib/auth-context";
import { listRoles } from "@/lib/services/users";
import { PERMISSIONS, ROLE_MATRIX } from "@/lib/rbac/permissions";

export const metadata = { title: "Roles" };

const ALL_MODULES = Array.from(new Set(PERMISSIONS.map((p) => p.module))).sort();

export default async function RolesPage() {
  await requireActorFromSession();
  const roles = await listRoles();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Roles &amp; permissions</h1>
        <p className="text-sm text-[var(--color-muted-fg)]">
          System roles with their module-level grants. Managed in code via{" "}
          <code>lib/rbac/permissions.ts</code>; run <code>pnpm db:seed</code> after changes.
        </p>
      </header>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[rgb(var(--token-muted)/0.50)] text-left text-xs uppercase tracking-wider text-[var(--color-muted-fg)]">
              <tr>
                <th className="sticky left-0 bg-[rgb(var(--token-muted)/0.50)] px-4 py-3">Module</th>
                {roles.map((r) => (
                  <th key={r.id} className="px-4 py-3 text-center">
                    <div>{r.name}</div>
                    <div className="mt-1 text-[10px] font-normal normal-case text-[var(--color-muted-fg)]">
                      {r._count.users} member{r._count.users === 1 ? "" : "s"}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_MODULES.map((mod) => (
                <tr key={mod} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="sticky left-0 bg-[var(--color-card)] px-4 py-3 font-medium">{mod}</td>
                  {roles.map((r) => {
                    const grant = ROLE_MATRIX[r.name]?.[mod];
                    const label =
                      grant === "*" ? "All" : Array.isArray(grant) ? grant.join(", ") : "—";
                    return (
                      <td key={r.id} className="px-4 py-3 text-center text-xs text-[var(--color-muted-fg)]">
                        {label}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
