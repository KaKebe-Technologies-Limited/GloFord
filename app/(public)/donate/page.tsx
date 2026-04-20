import { db } from "@/lib/db";
import { listActiveCampaigns } from "@/lib/services/campaigns";
import { DonateWidget } from "@/components/donate/DonateWidget";
import Link from "next/link";
import { formatMoney } from "@/lib/utils/money";

export const metadata = { title: "Donate" };

export default async function DonatePage() {
  const org = await db.organization.findFirst({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });
  if (!org) return null;

  const campaigns = await listActiveCampaigns(org.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <header className="mx-auto max-w-3xl text-center space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Support {org.name}</h1>
        <p className="text-lg text-[--color-muted-fg]">
          Your gift funds community-led programs in health, education, and resilience.
        </p>
      </header>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_420px]">
        <section>
          <h2 className="text-lg font-semibold">Active campaigns</h2>
          <p className="mt-1 text-sm text-[--color-muted-fg]">
            Or make a general donation on the right.
          </p>
          {campaigns.length === 0 ? (
            <p className="mt-6 text-sm text-[--color-muted-fg]">
              No active campaigns right now. General donations go to our greatest-need fund.
            </p>
          ) : (
            <ul className="mt-6 space-y-3">
              {campaigns.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/donate/${c.slug}`}
                    className="block rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] p-5 transition hover:shadow-sm"
                  >
                    <h3 className="font-semibold">{c.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-[--color-muted-fg]">{c.description}</p>
                    {c.goalCents ? (
                      <p className="mt-2 text-xs text-[--color-muted-fg]">
                        Goal: {formatMoney(c.goalCents, c.currency)}
                      </p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <DonateWidget />
        </aside>
      </div>
    </div>
  );
}
