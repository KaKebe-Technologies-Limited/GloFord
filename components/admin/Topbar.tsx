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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-100 bg-white px-4 sm:px-6">
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="text-right">
          <p className="text-sm font-medium leading-none text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            className="h-9 w-9 rounded-full object-cover ring-2 ring-gray-100"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--color-primary)] text-sm font-bold text-white"
          >
            {user.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <form action={signOutAction}>
          <button
            type="submit"
            aria-label="Sign out"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </header>
  );
}
