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
    <header className="sticky top-0 z-30 flex h-[52px] items-center justify-between border-b border-[var(--color-border)] bg-[rgb(var(--token-bg)/0.80)] px-4 backdrop-blur-xl sm:px-6">
      {/* Mobile menu trigger */}
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-muted-fg)] transition hover:bg-[var(--color-muted)] hover:text-[var(--color-fg)] md:hidden"
      >
        <Menu className="h-[18px] w-[18px]" />
      </button>

      {/* Spacer on desktop */}
      <div className="hidden md:block" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <div className="mr-1 text-right">
          <p className="text-[13px] font-medium leading-none text-[var(--color-fg)]">
            {user.name}
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--color-muted-fg)]">
            {user.email}
          </p>
        </div>
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            className="h-8 w-8 rounded-full object-cover ring-1 ring-[var(--color-border)]"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-primary)] text-[11px] font-bold text-white"
          >
            {user.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <form action={signOutAction}>
          <button
            type="submit"
            aria-label="Sign out"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-muted-fg)] transition hover:bg-[var(--color-muted)] hover:text-[var(--color-fg)]"
          >
            <LogOut className="h-[15px] w-[15px]" />
          </button>
        </form>
      </div>
    </header>
  );
}
