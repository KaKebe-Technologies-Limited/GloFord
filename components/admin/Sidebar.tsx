"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  PenTool,
  Image,
  HandCoins,
  Users,
  Send,
  Tag,
  CalendarDays,
  Settings,
  Palette,
  Shield,
  History,
  Flag,
  Activity,
  AlertTriangle,
  CreditCard,
  X,
  Navigation,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip";

type Group = {
  key: string;
  items: { href: string; key: string; icon: React.ElementType }[];
};

const GROUPS: Group[] = [
  {
    key: "content",
    items: [
      { href: "/admin/dashboard", key: "dashboard", icon: LayoutDashboard },
      { href: "/admin/pages", key: "pages", icon: FileText },
      { href: "/admin/programs", key: "programs", icon: Briefcase },
      { href: "/admin/posts", key: "posts", icon: PenTool },
      { href: "/admin/media", key: "media", icon: Image },
    ],
  },
  {
    key: "finance",
    items: [
      { href: "/admin/campaigns", key: "campaigns", icon: HandCoins },
      { href: "/admin/donations", key: "donations", icon: HandCoins },
      { href: "/admin/donors", key: "donors", icon: Users },
    ],
  },
  {
    key: "communications",
    items: [
      { href: "/admin/subscribers", key: "subscribers", icon: Users },
      { href: "/admin/segments", key: "segments", icon: Tag },
      { href: "/admin/newsletters", key: "newsletters", icon: Send },
      { href: "/admin/email-campaigns", key: "emailCampaigns", icon: Send },
      { href: "/admin/events", key: "events", icon: CalendarDays },
    ],
  },
  {
    key: "settings",
    items: [
      { href: "/admin/users", key: "users", icon: Users },
      { href: "/admin/roles", key: "roles", icon: Shield },
      { href: "/admin/theme", key: "theme", icon: Palette },
      { href: "/admin/nav", key: "nav", icon: Navigation },
      { href: "/admin/settings", key: "settings", icon: Settings },
      { href: "/admin/settings/payments", key: "payments", icon: CreditCard },
    ],
  },
  {
    key: "system",
    items: [
      { href: "/admin/system/audit", key: "audit", icon: History },
      { href: "/admin/system/versions", key: "versions", icon: History },
      { href: "/admin/system/dead-letter", key: "deadLetter", icon: AlertTriangle },
      { href: "/admin/system/feature-flags", key: "featureFlags", icon: Flag },
      { href: "/admin/system/health", key: "health", icon: Activity },
    ],
  },
];

export function Sidebar({
  mobileOpen,
  onMobileClose,
  userRole,
}: {
  mobileOpen: boolean;
  onMobileClose: () => void;
  userRole: string;
}) {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();

  return (
    <>
      {/* Mobile drawer backdrop */}
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-[--color-border] bg-[--color-card] transition-transform",
          "md:w-16 md:translate-x-0 lg:w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
        aria-label="Admin navigation"
      >
        <div className="flex h-16 items-center justify-between border-b border-[--color-border] px-4">
          <Link href="/admin/dashboard" className="font-semibold tracking-tight md:hidden lg:block">
            Gloford
          </Link>
          <button
            onClick={onMobileClose}
            aria-label="Close menu"
            className="inline-flex h-10 w-10 items-center justify-center md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {GROUPS.map((group) => (
            <div key={group.key} className="mb-4">
              <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wider text-[--color-muted-fg] md:hidden lg:block">
                {t(group.key)}
              </p>
              <ul className="space-y-0.5">
                {group.items.map(({ href, key, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(href + "/");
                  return (
                    <li key={href}>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <Link
                            href={href}
                            onClick={onMobileClose}
                            className={cn(
                              "flex items-center gap-3 rounded-[--radius-md] px-3 py-2 text-sm transition-colors",
                              active
                                ? "bg-[--color-primary] text-[--color-primary-fg]"
                                : "text-[--color-fg]/80 hover:bg-[--color-muted]",
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                            <span className="md:hidden lg:inline">{t(key)}</span>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="md:block lg:hidden">
                          {t(key)}
                        </TooltipContent>
                      </Tooltip>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-[--color-border] p-3 text-xs text-[--color-muted-fg] md:hidden lg:block">
          Signed in as <span className="font-medium text-[--color-fg]">{userRole}</span>
        </div>
      </aside>
    </>
  );
}
