"use client";

import { Menu, LogOut } from "lucide-react";
import { signOutAction } from "./actions";
import type { AdminUser } from "./AdminShell";

export function Topbar({
  user,
  onMenuClick,
}: {
  user: AdminUser;
  onMenuClick: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[--color-border] bg-[--color-bg]/80 px-4 backdrop-blur">
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className="inline-flex h-10 w-10 items-center justify-center rounded-[--radius-md] border border-[--color-border] md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="text-right">
          <p className="text-sm font-medium leading-none">{user.name}</p>
          <p className="text-xs text-[--color-muted-fg]">{user.email}</p>
        </div>
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar from OAuth IdP, size is fixed
          <img
            src={user.image}
            alt=""
            className="h-9 w-9 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-full bg-[--color-primary] text-sm font-medium text-[--color-primary-fg]"
          >
            {user.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <form action={signOutAction}>
          <button
            type="submit"
            aria-label="Sign out"
            className="inline-flex h-10 w-10 items-center justify-center rounded-[--radius-md] border border-[--color-border] hover:bg-[--color-muted]"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </header>
  );
}
