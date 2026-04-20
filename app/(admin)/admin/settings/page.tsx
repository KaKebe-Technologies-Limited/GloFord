import Link from "next/link";
import { CreditCard, Palette, Globe, Shield } from "lucide-react";
import { requireActorFromSession } from "@/lib/auth-context";

export const metadata = { title: "Settings" };

const CARDS = [
  {
    href: "/admin/settings/payments",
    title: "Payments",
    description: "Enable Stripe, Pesapal, Flutterwave, MTN MoMo, and Airtel Money. Paste keys to go live.",
    icon: CreditCard,
  },
  {
    href: "/admin/theme",
    title: "Theme",
    description: "Colors, typography, and brand tokens applied across the platform.",
    icon: Palette,
  },
  {
    href: "/admin/settings",
    title: "Site",
    description: "Site name, contact info, socials, and SEO defaults.",
    icon: Globe,
  },
  {
    href: "/admin/roles",
    title: "Roles & permissions",
    description: "Control who can edit content, manage finance, or publish newsletters.",
    icon: Shield,
  },
] as const;

export default async function SettingsHub() {
  await requireActorFromSession();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-[--color-muted-fg]">
          System-wide configuration. Changes take effect immediately.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] p-5 transition hover:shadow-sm"
          >
            <c.icon className="h-5 w-5 text-[--color-primary]" aria-hidden="true" />
            <h2 className="mt-3 font-semibold">{c.title}</h2>
            <p className="mt-1 text-sm text-[--color-muted-fg]">{c.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
