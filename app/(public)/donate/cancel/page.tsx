import Link from "next/link";

export const metadata = { title: "Donation canceled" };

export default function DonateCancelPage() {
  return (
    <main className="mx-auto grid max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">No charge was made</h1>
      <p className="mt-3 text-[var(--color-muted-fg)]">
        You canceled the payment. If something went wrong, you can try again.
      </p>
      <div className="mt-8">
        <Link
          href="/donate"
          className="inline-flex items-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-fg)]"
        >
          Try again
        </Link>
      </div>
    </main>
  );
}
