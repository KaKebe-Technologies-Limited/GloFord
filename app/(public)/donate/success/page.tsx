import Link from "next/link";

export const metadata = { title: "Thank you" };

/**
 * Donor returns here after completing Stripe Checkout. The webhook
 * is the source of truth for donation state — we don't trust the
 * session_id query param to confirm payment.
 */
export default function DonateSuccessPage() {
  return (
    <main className="mx-auto grid max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Thank you.</h1>
      <p className="mt-3 text-[--color-muted-fg]">
        Your donation is being processed. You\u2019ll receive a confirmation email with a receipt shortly.
      </p>
      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center rounded-[--radius-md] border border-[--color-border] px-4 py-2 text-sm font-medium hover:bg-[--color-muted]"
        >
          Back to site
        </Link>
      </div>
    </main>
  );
}
