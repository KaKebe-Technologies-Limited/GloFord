"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export type AdminUser = {
  name: string;
  email: string;
  image: string | null;
  role: string;
};

export function AdminShell({
  user,
  children,
}: {
  user: AdminUser;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-[100dvh] bg-[var(--color-surface-2)]">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        user={{ name: user.name, role: user.role, image: user.image }}
      />
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col transition-[padding-left] duration-300",
          "max-md:!pl-0",
          collapsed ? "md:pl-[60px]" : "md:pl-[260px]",
        )}
      >
        <Topbar user={user} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1200px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
