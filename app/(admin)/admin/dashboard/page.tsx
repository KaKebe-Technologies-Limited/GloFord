import { getTranslations } from "next-intl/server";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const t = await getTranslations("admin");
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("dashboard")}</h1>
        <p className="text-sm text-[--color-muted-fg]">
          Welcome back. This is the Phase 1 shell \u2014 real metrics arrive with each module.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Pages", "Programs", "Subscribers", "Donations"].map((label) => (
          <div
            key={label}
            className="rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] p-5"
          >
            <p className="text-xs uppercase tracking-wide text-[--color-muted-fg]">{label}</p>
            <p className="mt-2 text-3xl font-semibold">\u2014</p>
          </div>
        ))}
      </div>
    </div>
  );
}
