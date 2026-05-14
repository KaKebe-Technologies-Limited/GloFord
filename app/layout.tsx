import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { getActiveThemeTokens } from "@/lib/theme/service";
import { getBrand } from "@/config/brand";
import { isRtl } from "@/lib/i18n/config";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { TooltipProvider } from "@/components/ui/Tooltip";
import "./globals.css";

const inter = localFont({
  src: "../public/fonts/inter-latin.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});

const playfair = localFont({
  src: "../public/fonts/playfair-latin.woff2",
  variable: "--font-playfair",
  display: "swap",
  weight: "400 900",
});

const ibmPlexArabic = localFont({
  src: "../public/fonts/ibm-plex-arabic.woff2",
  variable: "--font-arabic",
  display: "swap",
  weight: "400 700",
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
    icons: {
      icon: [
        { url: "/favicon.png", type: "image/png" },
        { url: "/logo.png", type: "image/png", sizes: "192x192" },
      ],
      apple: "/logo.png",
    },
    openGraph: {
      siteName: brand.name,
      type: "website",
      locale: "en_US",
      images: [{ url: "/logo.png", width: 512, height: 512, alt: brand.name }],
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
  // Override :root CSS defaults with DB-driven theme tokens.
  // Uses !important to beat the static :root defaults in globals.css.
  // The ThemeEditor's live preview uses inline styles on <html> which
  // always beat stylesheet rules, ensuring instant preview works.
  const cssVars = Object.entries(tokens)
    .map(([k, v]) => `--token-${k}:${v} !important`)
    .join(";");
  const themeStyle = `:root{${cssVars}}`;

  return (
    <html
      lang={locale}
      dir={isRtl(locale) ? "rtl" : "ltr"}
      className={`${inter.variable} ${playfair.variable} ${ibmPlexArabic.variable}`}
      suppressHydrationWarning
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeStyle }} />
      </head>
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
