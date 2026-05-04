"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Users } from "lucide-react";
import { useTranslations } from "next-intl";

interface DonationDay {
  date: string;
  count: number;
  totalCents: number;
}

interface SubscriberDay {
  date: string;
  count: number;
}

interface AnalyticsData {
  donations: DonationDay[];
  subscribers: SubscriberDay[];
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en", { month: "short", day: "numeric" });
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function AnalyticsCharts() {
  const t = useTranslations("admin.analytics");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d: AnalyticsData) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    );
  }

  if (!data) return null;

  const donationChartData = data.donations.map((d) => ({
    name: formatShortDate(d.date),
    amount: d.totalCents / 100,
    count: d.count,
  }));

  const subscriberChartData = data.subscribers.map((d) => ({
    name: formatShortDate(d.date),
    signups: d.count,
  }));

  const totalDonations = data.donations.reduce((s, d) => s + d.totalCents, 0);
  const totalSignups = data.subscribers.reduce((s, d) => s + d.count, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Donation trend */}
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--color-muted-fg)]" aria-hidden="true" />
            <h3 className="text-[13px] font-semibold text-[var(--color-fg)]">
              {t("donationTrend")}
            </h3>
          </div>
          <span className="text-[12px] font-medium text-[var(--color-primary)]">
            {formatCurrency(totalDonations)} {t("last30")}
          </span>
        </div>
        <div className="px-4 py-4">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={donationChartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="donationGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "var(--color-muted-fg)" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--color-muted-fg)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `$${v}`}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-card)",
                }}
                formatter={(value) => [formatCurrency(Number(value) * 100), t("amount")]}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#donationGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subscriber growth */}
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[var(--color-muted-fg)]" aria-hidden="true" />
            <h3 className="text-[13px] font-semibold text-[var(--color-fg)]">
              {t("subscriberGrowth")}
            </h3>
          </div>
          <span className="text-[12px] font-medium text-[var(--color-accent)]">
            +{totalSignups} {t("last30")}
          </span>
        </div>
        <div className="px-4 py-4">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={subscriberChartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "var(--color-muted-fg)" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--color-muted-fg)" }}
                tickLine={false}
                axisLine={false}
                width={30}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-card)",
                }}
                formatter={(value) => [Number(value), t("signups")]}
              />
              <Bar
                dataKey="signups"
                fill="var(--color-accent)"
                radius={[3, 3, 0, 0]}
                maxBarSize={12}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-[250px] animate-pulse rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-muted)]" />
  );
}
