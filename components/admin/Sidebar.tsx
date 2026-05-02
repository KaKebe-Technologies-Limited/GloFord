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
  MessageSquareQuote,
  Quote,
  BarChart3,
  SlidersHorizontal,
  HelpCircle,
  Handshake,
  Newspaper,
  PanelLeftClose,
  PanelLeft,
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
      { href: "/admin/posts", key: "posts", icon: PenTool },
      { href: "/admin/programs", key: "programs", icon: Briefcase },
      { href: "/admin/impact-stories", key: "impactStories", icon: FileText },
      { href: "/admin/press", key: "press", icon: Newspaper },
      { href: "/admin/reports", key: "reports", icon: FileText },
      { href: "/admin/media", key: "media", icon: Image },
    ],
  },
  {
    key: "people",
    items: [
      { href: "/admin/team", key: "team", icon: Users },
      { href: "/admin/partners", key: "partners", icon: Handshake },
      { href: "/admin/testimonials", key: "testimonials", icon: MessageSquareQuote },
      { href: "/admin/leader-messages", key: "leaderMessages", icon: Quote },
    ],
  },
  {
    key: "engage",
    items: [
      { href: "/admin/careers", key: "careers", icon: Briefcase },
      { href: "/admin/volunteer", key: "volunteer", icon: HandCoins },
      { href: "/admin/partner-applications", key: "partnerApplications", icon: Handshake },
      { href: "/admin/contact-messages", key: "contactMessages", icon: Send },
      { href: "/admin/faqs", key: "faqs", icon: HelpCircle },
      { href: "/admin/events", key: "events", icon: CalendarDays },
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
    ],
  },
  {
    key: "settings",
    items: [
      { href: "/admin/hero-slides", key: "heroSlides", icon: SlidersHorizontal },
      { href: "/admin/site-stats", key: "siteStats", icon: BarChart3 },
      { href: "/admin/theme", key: "theme", icon: Palette },
      { href: "/admin/nav", key: "nav", icon: Navigation },
      { href: "/admin/users", key: "users", icon: Users },
      { href: "/admin/roles", key: "roles", icon: Shield },
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
  collapsed,
  onToggleCollapse,
  user,
}: {
  mobileOpen: boolean;
  onMobileClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  user: { name: string; role: string; image: string | null };
}) {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();
  const expanded = !collapsed;

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/[0.06] bg-[rgb(18_30_26)] text-white transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
          expanded ? "w-[260px]" : "w-[60px]",
          mobileOpen
            ? "w-[260px] translate-x-0"
            : "-translate-x-full md:translate-x-0",
        )}
        aria-label="Admin navigation"
      >
        {/* Brand header */}
        <div className="flex h-[60px] shrink-0 items-center justify-between px-3">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2.5 overflow-hidden"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[rgb(37_85_73)] to-[rgb(26_60_52)] text-xs font-bold shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]">
              G
            </div>
            <span
              className={cn(
                "whitespace-nowrap text-[15px] font-semibold tracking-[-0.01em] transition-all duration-300",
                expanded ? "w-auto opacity-100" : "w-0 opacity-0",
              )}
            >
              Gloford
            </span>
          </Link>
          {/* Mobile close */}
          <button
            onClick={onMobileClose}
            aria-label="Close menu"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/40 transition hover:bg-white/[0.06] hover:text-white md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
          {GROUPS.map((group, gi) => (
            <div key={group.key} className={cn(gi > 0 && "mt-5")}>
              {/* Group label — expanded */}
              <div
                className={cn(
                  "mb-1 overflow-hidden whitespace-nowrap px-2.5 text-[10px] font-medium uppercase tracking-[0.08em] text-white/30 transition-all duration-300",
                  expanded ? "h-4 opacity-100" : "h-0 opacity-0",
                )}
              >
                {t(group.key)}
              </div>
              {/* Collapsed divider */}
              {!expanded && gi > 0 && (
                <div className="mx-auto mb-2 h-px w-5 bg-white/[0.08]" />
              )}
              <ul className="space-y-px">
                {group.items.map(({ href, key, icon: Icon }) => {
                  const active =
                    pathname === href || pathname.startsWith(href + "/");
                  return (
                    <li key={href}>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <Link
                            href={href}
                            onClick={onMobileClose}
                            className={cn(
                              "group relative flex items-center rounded-md transition-colors duration-150",
                              expanded ? "gap-2.5 px-2.5 py-[7px]" : "justify-center px-0 py-[7px]",
                              active
                                ? "bg-white/[0.10] font-medium text-white"
                                : "text-white/50 hover:bg-white/[0.06] hover:text-white/80",
                            )}
                          >
                            {/* Active accent bar */}
                            {active && (
                              <div className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-[rgb(45_170_100)]" />
                            )}
                            <Icon
                              className={cn(
                                "h-[16px] w-[16px] shrink-0 transition-colors",
                                active
                                  ? "text-white"
                                  : "text-white/40 group-hover:text-white/60",
                              )}
                              aria-hidden="true"
                              strokeWidth={1.75}
                            />
                            <span
                              className={cn(
                                "truncate whitespace-nowrap text-[13px] transition-all duration-300",
                                expanded ? "w-auto opacity-100" : "w-0 opacity-0",
                              )}
                            >
                              {t(key)}
                            </span>
                          </Link>
                        </TooltipTrigger>
                        {!expanded && (
                          <TooltipContent side="right" sideOffset={8}>
                            {t(key)}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Collapse toggle — desktop */}
        <div className="hidden shrink-0 border-t border-white/[0.06] md:block">
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex w-full items-center py-2.5 text-[11px] text-white/25 transition hover:text-white/50",
              expanded ? "gap-2.5 px-[18px]" : "justify-center px-0",
            )}
          >
            {collapsed ? (
              <PanelLeft className="h-[15px] w-[15px] shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="h-[15px] w-[15px] shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>

        {/* User */}
        <div className="shrink-0 border-t border-white/[0.06] p-2.5">
          <div
            className={cn(
              "flex items-center overflow-hidden rounded-md p-1.5 transition-colors hover:bg-white/[0.04]",
              expanded ? "gap-2.5" : "justify-center",
            )}
          >
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt=""
                className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-white/10"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[11px] font-semibold text-white/70">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            {expanded && (
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium leading-tight text-white/80">
                  {user.name}
                </p>
                <p className="truncate text-[10px] leading-tight text-white/30">
                  {user.role}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
