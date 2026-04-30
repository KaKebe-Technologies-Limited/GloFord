import { requireActorFromSession } from "@/lib/auth-context";
import { getApplicationsForCareer } from "@/lib/services/careers";
import { db } from "@/lib/db";
import { ApplicationsClient } from "./ApplicationsClient";

export const metadata = { title: "Career Applications" };

export default async function CareerApplicationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireActorFromSession();
  const { id } = await params;
  const career = await db.career.findUniqueOrThrow({
    where: { id },
    select: { id: true, title: true },
  });
  const applications = await getApplicationsForCareer(id);
  return <ApplicationsClient career={career} applications={applications} />;
}
