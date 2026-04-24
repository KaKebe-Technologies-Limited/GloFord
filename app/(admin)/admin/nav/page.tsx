import { requireActorFromSession } from "@/lib/auth-context";
import { listNavItems } from "@/lib/services/nav";
import { NavManager } from "./NavManager";

export const metadata = { title: "Navigation" };

export default async function NavPage() {
  await requireActorFromSession();
  const items = await listNavItems();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Navigation</h1>
        <p className="text-sm text-[--color-muted-fg]">
          Manage header, footer, and sidebar links.
        </p>
      </header>
      <NavManager
        items={items.map((i) => ({
          id: i.id,
          location: i.location,
          parentId: i.parentId,
          label: i.label,
          href: i.href ?? "",
          pageId: i.pageId ?? "",
          order: i.order,
          isActive: i.isActive,
        }))}
      />
    </div>
  );
}
