import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[60dvh] place-items-center px-4">
      <div className="max-w-md space-y-3 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-fg)]">404</p>
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="text-sm text-[var(--color-muted-fg)]">
          The page you\u2019re looking for doesn\u2019t exist or was moved.
        </p>
        <Link
          href="/"
          className="inline-block rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-muted)]"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
