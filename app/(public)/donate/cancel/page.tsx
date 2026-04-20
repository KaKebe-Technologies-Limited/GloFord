import Link from "next/link";

export const metadata = { title: "Donation canceled" };

export default function DonateCancelPage() {
  return (
    <main className="mx-auto grid max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">No charge was made</h1>
      <p className="mt-3 text-[--color-muted-fg]">
        You canceled the payment. If something went wrong, you can try again.
      </p>
      <div className="mt-8">
        <Link
          href="/donate"
          className="inline-flex items-center rounded-[--radius-md] bg-[--color-primary] px-4 py-2 text-sm font-medium text-[--color-primary-fg]"
        >
          Try again
        </Link>
      </div>
    </main>
  );
}
