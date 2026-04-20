/**
 * Money helpers. We always store money as integer cents + currency code;
 * formatting is a pure presentational concern.
 */

export function formatMoney(cents: number, currency = "USD", locale?: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/** Suggested preset amounts in cents for a given currency. */
export function defaultPresets(currency: string): number[] {
  const c = currency.toUpperCase();
  if (c === "USD" || c === "EUR" || c === "GBP") return [2500, 5000, 10000, 25000];
  if (c === "KES") return [50000, 100000, 250000, 500000];
  return [2500, 5000, 10000, 25000];
}
