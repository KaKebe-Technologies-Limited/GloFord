import Link from "next/link";

export const metadata = { title: "Thank you" };

/**
 * Donor returns here after completing payment checkout. The webhook
 * is the source of truth for donation state.
 */
export default function DonateSuccessPage() {
  return (
    <main className="mx-auto grid max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Thank you.</h1>
      <p className="mt-3 text-[var(--color-muted-fg)]">
        Your donation is being processed. You\u2019ll receive a confirmation email with a receipt shortly.
      </p>
      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-muted)]"
        >
          Back to site
        </Link>
      </div>
    </main>
  );
}
