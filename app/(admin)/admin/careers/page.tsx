import { requireActorFromSession } from "@/lib/auth-context";
import { getAllCareers } from "@/lib/services/careers";
import { CareersClient } from "./CareersClient";

export const metadata = { title: "Careers" };

export default async function CareersAdminPage() {
  await requireActorFromSession();
  const careers = await getAllCareers();
  // Serialize JSON fields for client component
  const serialized = careers.map((c) => ({
    ...c,
    requirements: (c.requirements as string[]) ?? [],
    responsibilities: (c.responsibilities as string[]) ?? [],
    qualifications: (c.qualifications as string[]) ?? [],
    benefits: (c.benefits as string[]) ?? [],
  }));
  return <CareersClient careers={serialized} />;
}
