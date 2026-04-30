import Link from "next/link";
import { confirmSubscriberAction } from "@/lib/actions/subscribers";

export const metadata = { title: "Confirm subscription" };

export default async function ConfirmPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let ok = false;
  let errMsg: string | null = null;
  try {
    const r = await confirmSubscriberAction(token);
    ok = r.ok;
  } catch (e) {
    errMsg = e instanceof Error ? e.message : "Could not confirm";
  }

  return (
    <main className="mx-auto grid max-w-xl px-4 py-24 text-center">
      {ok ? (
        <>
          <h1 className="text-3xl font-semibold tracking-tight">You\u2019re subscribed</h1>
          <p className="mt-3 text-[var(--color-muted-fg)]">
            Thanks for confirming. We\u2019ll be in touch with updates and stories soon.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-semibold tracking-tight">Link invalid</h1>
          <p className="mt-3 text-[var(--color-muted-fg)]">{errMsg ?? "This confirmation link is no longer valid."}</p>
        </>
      )}
      <Link
        href="/"
        className="mt-8 inline-block rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium"
      >
        Back to home
      </Link>
    </main>
  );
}
