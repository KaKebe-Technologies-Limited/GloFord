import { requireActorFromSession } from "@/lib/auth-context";
import { getAllSiteStats } from "@/lib/services/siteStats";
import { SiteStatsClient } from "./SiteStatsClient";

export const metadata = { title: "Site Statistics" };

export default async function SiteStatsAdminPage() {
  await requireActorFromSession();
  const stats = await getAllSiteStats();
  return <SiteStatsClient stats={stats} />;
}
