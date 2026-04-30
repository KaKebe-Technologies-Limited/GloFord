import { requireActorFromSession } from "@/lib/auth-context";
import { getAllVolunteerOpportunities } from "@/lib/services/volunteer";
import { VolunteerClient } from "./VolunteerClient";

export const metadata = { title: "Volunteer Opportunities" };

export default async function VolunteerAdminPage() {
  await requireActorFromSession();
  const opportunities = await getAllVolunteerOpportunities();
  const serialized = opportunities.map((o) => ({
    ...o,
    requirements: (o.requirements as string[]) ?? [],
    benefits: (o.benefits as string[]) ?? [],
  }));
  return <VolunteerClient opportunities={serialized} />;
}
