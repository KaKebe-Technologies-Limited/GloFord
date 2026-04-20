import { getRequestConfig } from "next-intl/server";
import { defaultLocale, locales, type Locale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = (await requestLocale) as Locale | undefined;
  const locale: Locale = requested && locales.includes(requested) ? requested : defaultLocale;
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
