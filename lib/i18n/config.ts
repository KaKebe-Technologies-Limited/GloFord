export const locales = ["en", "fr", "sw", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  sw: "Kiswahili",
  ar: "العربية",
};

/** Locales that use right-to-left text direction */
export const RTL_LOCALES: ReadonlySet<string> = new Set(["ar"]);

export function isRtl(locale: string): boolean {
  return RTL_LOCALES.has(locale);
}

/**
 * Map country codes (ISO 3166-1 alpha-2) to preferred locale.
 * Used by geo-IP auto-detection in middleware.
 */
export const COUNTRY_LOCALE_MAP: Record<string, Locale> = {
  // Arabic-speaking
  SA: "ar", AE: "ar", EG: "ar", IQ: "ar", JO: "ar", KW: "ar",
  LB: "ar", LY: "ar", MA: "ar", OM: "ar", QA: "ar", SD: "ar",
  SY: "ar", TN: "ar", YE: "ar", BH: "ar", DZ: "ar", PS: "ar",
  // French-speaking Africa + France
  FR: "fr", BE: "fr", CH: "fr", CD: "fr", CI: "fr", SN: "fr",
  CM: "fr", ML: "fr", BF: "fr", NE: "fr", TD: "fr", GN: "fr",
  RW: "fr", BI: "fr", MG: "fr", TG: "fr", BJ: "fr", GA: "fr",
  CG: "fr", DJ: "fr", CF: "fr", HT: "fr", KM: "fr",
  // Swahili-speaking
  TZ: "sw", KE: "sw", UG: "sw",
  // Everything else falls through to defaultLocale (en)
};
