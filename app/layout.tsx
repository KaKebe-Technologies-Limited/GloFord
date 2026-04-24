import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { getActiveThemeTokens } from "@/lib/theme/service";
import { getBrand } from "@/config/brand";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const brand = getBrand();
  return {
    title: {
      default: brand.name,
      template: `%s · ${brand.name}`,
    },
    description: `${brand.name} — community partnerships for impact.`,
    icons: { icon: "/favicon.ico" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
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
    <html
      lang={locale}
      style={style}
      className={`${inter.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
