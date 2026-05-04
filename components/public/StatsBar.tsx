import { db } from "@/lib/db";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { AnimatedCounter } from "@/components/motion/AnimatedCounter";

export async function StatsBar() {
  const dbStats = await db.siteStatistic
    .findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    })
    .catch(() => [] as Array<{ id: string; label: string; value: string; icon: string | null }>);

  // Auto-compute fallback stats when the DB table is empty
  if (dbStats.length === 0) {
    const [programCount, livesEstimate] = await Promise.all([
      db.program.count({ where: { status: "PUBLISHED" } }).catch(() => 0),
      Promise.all([
        db.donation.count({ where: { status: "SUCCEEDED" } }).catch(() => 0),
        db.subscriber.count().catch(() => 0),
        db.event.count().catch(() => 0),
      ]).then(([d, s, e]) => d + s + e),
    ]);

    const foundingYear = 2017;
    const yearsOfImpact = new Date().getFullYear() - foundingYear;

    const autoStats = [
      { id: "_communities", label: "Communities Served", value: "45+" },
      {
        id: "_lives",
        label: "Lives Impacted",
        value:
          livesEstimate > 0
            ? `${livesEstimate.toLocaleString("en")}+`
            : "500+",
      },
      {
        id: "_programs",
        label: "Active Programs",
        value: programCount > 0 ? `${programCount}` : "8",
      },
      { id: "_years", label: "Years of Impact", value: `${yearsOfImpact}+` },
    ];

    return <StatsGrid stats={autoStats} />;
  }

  return <StatsGrid stats={dbStats} />;
}

function StatsGrid({
  stats,
}: {
  stats: Array<{ id: string; label: string; value: string }>;
}) {
  return (
    <section className="border-y border-[var(--color-border)] bg-[rgb(248_250_249)] py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, i) => (
            <ScrollReveal key={stat.id} delay={i * 0.1}>
              <div className="text-center">
                <AnimatedCounter
                  value={stat.value}
                  className="block text-3xl font-bold text-[var(--color-primary)] sm:text-4xl"
                />
                <p className="mt-2 text-sm text-[var(--color-muted-fg)]">
                  {stat.label}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
