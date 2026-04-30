/**
 * White-label brand configuration, sourced entirely from env vars.
 *
 * Every deployment of this codebase points at a specific client. That
 * client's name, logo URL, primary color, support email, and so on all
 * come from env so no code change is needed to rebrand — just redeploy
 * with a different env file.
 *
 * Runtime edits (via the admin UI → SiteSettings / Theme) take
 * precedence at render time; env values are the sensible defaults that
 * ship in emails and OG tags before anyone logs into the admin.
 */

export type BrandConfig = {
  name: string;
  siteUrl: string;
  logoUrl: string | null;
  supportEmail: string | null;
  fromEmail: string;
  primaryColor: string;
  country: string | null;
  defaultCurrency: string;
  locale: string;
};

const DEFAULT: BrandConfig = {
  name: "Platform",
  siteUrl: "http://localhost:3000",
  logoUrl: null,
  supportEmail: null,
  fromEmail: "no-reply@example.org",
  primaryColor: "#1a3c34",
  country: null,
  defaultCurrency: "USD",
  locale: "en",
};

let cached: BrandConfig | null = null;

export function getBrand(): BrandConfig {
  if (cached) return cached;
  cached = {
    name: process.env.BRAND_NAME ?? DEFAULT.name,
    siteUrl: process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT.siteUrl,
    logoUrl: process.env.BRAND_LOGO_URL ?? DEFAULT.logoUrl,
    supportEmail: process.env.BRAND_SUPPORT_EMAIL ?? DEFAULT.supportEmail,
    fromEmail: process.env.MAIL_FROM ?? DEFAULT.fromEmail,
    primaryColor: process.env.BRAND_PRIMARY_COLOR ?? DEFAULT.primaryColor,
    country: process.env.BRAND_COUNTRY ?? DEFAULT.country,
    defaultCurrency:
      (process.env.BRAND_DEFAULT_CURRENCY ?? DEFAULT.defaultCurrency).toUpperCase(),
    locale: process.env.BRAND_LOCALE ?? DEFAULT.locale,
  };
  return cached;
}

/** For test setup only — forget the memo between runs. */
export function __resetBrandForTests() {
  cached = null;
}
