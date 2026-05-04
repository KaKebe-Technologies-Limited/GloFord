import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, IBM_Plex_Sans_Arabic } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { getActiveThemeTokens } from "@/lib/theme/service";
import { getBrand } from "@/config/brand";
import { isRtl } from "@/lib/i18n/config";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { TooltipProvider } from "@/components/ui/Tooltip";
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

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const brand = getBrand();
  return {
    metadataBase: new URL(brand.siteUrl),
    title: {
      default: brand.name,
      template: `%s · ${brand.name}`,
    },
    description: `${brand.name} — community partnerships for impact.`,
    icons: { icon: "/favicon.ico" },
    openGraph: {
      siteName: brand.name,
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      site: "@glofordug",
    },
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
      dir={isRtl(locale) ? "rtl" : "ltr"}
      style={style}
      className={`${inter.variable} ${playfair.variable} ${ibmPlexArabic.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          <NuqsAdapter>
            <NextIntlClientProvider locale={locale} messages={messages}>
              <TooltipProvider>
                {children}
              </TooltipProvider>
            </NextIntlClientProvider>
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
