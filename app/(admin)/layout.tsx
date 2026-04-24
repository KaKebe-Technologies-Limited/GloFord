import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?next=/admin");
  }
  return (
    <AdminShell
      user={{
        name: session.user.name ?? session.user.email ?? "Admin",
        email: session.user.email ?? "",
        image: session.user.image ?? null,
        role: session.user.role,
      }}
    >
      {children}
    </AdminShell>
  );
}
