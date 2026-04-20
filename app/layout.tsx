import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { getActiveThemeTokens } from "@/lib/theme/service";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Gloford",
    template: "%s \u00b7 Gloford",
  },
  description: "Community-driven development: health, education, and resilience.",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, messages, tokens] = await Promise.all([
    getLocale(),
    getMessages(),
    getActiveThemeTokens(),
  ]);
  const style = Object.fromEntries(
    Object.entries(tokens).map(([k, v]) => [`--token-${k}`, v]),
  ) as React.CSSProperties;

  return (
    <html lang={locale} style={style} suppressHydrationWarning>
      <body className="bg-[--color-bg] text-[--color-fg] font-sans">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
