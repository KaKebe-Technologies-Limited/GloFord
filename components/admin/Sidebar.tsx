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
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[rgb(26_40_35)] text-white transition-transform",
          "md:w-16 md:translate-x-0 lg:w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
        aria-label="Admin navigation"
      >
        {/* Brand header */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold tracking-tight md:hidden lg:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-sm font-bold">
              G
            </div>
            <span>Gloford</span>
          </Link>
          <Link href="/admin/dashboard" className="hidden md:flex lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-sm font-bold">
              G
            </div>
          </Link>
          <button
            onClick={onMobileClose}
            aria-label="Close menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:text-white md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {GROUPS.map((group) => (
            <div key={group.key} className="mb-5">
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/40 md:hidden lg:block">
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
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                              active
                                ? "bg-white/15 font-medium text-white"
                                : "text-white/60 hover:bg-white/8 hover:text-white/90",
                            )}
                          >
                            <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
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

        {/* User role badge */}
        <div className="border-t border-white/10 p-4 md:hidden lg:block">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <div className="h-2 w-2 rounded-full bg-green-400" />
            Signed in as <span className="font-medium text-white/80">{userRole}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
