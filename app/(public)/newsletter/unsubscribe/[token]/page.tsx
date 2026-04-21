import Link from "next/link";
import { unsubscribeAction } from "@/lib/actions/subscribers";

export const metadata = { title: "Unsubscribe" };

export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let ok = false;
  try {
    const r = await unsubscribeAction(token);
    ok = r.ok;
  } catch {
    ok = false;
  }

  return (
    <main className="mx-auto grid max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">
        {ok ? "You\u2019ve been unsubscribed" : "Link invalid"}
      </h1>
      <p className="mt-3 text-[--color-muted-fg]">
        {ok
          ? "You won\u2019t receive further email from us. You can always re-subscribe from our site."
          : "This unsubscribe link is no longer valid."}
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-[--radius-md] border border-[--color-border] px-4 py-2 text-sm font-medium"
      >
        Back to home
      </Link>
    </main>
  );
}
