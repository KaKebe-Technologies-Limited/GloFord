import { requireActorFromSession } from "@/lib/auth-context";
import { getApplicationsForOpportunity } from "@/lib/services/volunteer";
import { db } from "@/lib/db";
import { VolunteerApplicationsClient } from "./VolunteerApplicationsClient";

export const metadata = { title: "Volunteer Applications" };

export default async function VolunteerApplicationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireActorFromSession();
  const { id } = await params;
  const opportunity = await db.volunteerOpportunity.findUniqueOrThrow({
    where: { id },
    select: { id: true, title: true },
  });
  const applications = await getApplicationsForOpportunity(id);
  return (
    <VolunteerApplicationsClient
      opportunity={opportunity}
      applications={applications}
    />
  );
}
