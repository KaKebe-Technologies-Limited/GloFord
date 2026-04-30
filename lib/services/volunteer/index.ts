import { db } from "@/lib/db";
import { revalidateTag, unstable_cache } from "next/cache";

const CACHE_TAG = "volunteer";

export const getActiveVolunteerOpportunities = unstable_cache(
  async () => {
    return db.volunteerOpportunity.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { applications: true } } },
    });
  },
  ["volunteer-active"],
  { tags: [CACHE_TAG], revalidate: 3600 },
);

export async function getVolunteerBySlug(slug: string) {
  return db.volunteerOpportunity.findUniqueOrThrow({
    where: { slug },
    include: { _count: { select: { applications: true } } },
  });
}

export async function getAllVolunteerOpportunities() {
  return db.volunteerOpportunity.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { applications: true } } },
  });
}

export async function createVolunteerOpportunity(data: {
  title: string;
  slug: string;
  department: string;
  location: string;
  commitment: string;
  description: string;
  requirements?: string[];
  benefits?: string[];
}) {
  const opp = await db.volunteerOpportunity.create({ data });
  revalidateTag(CACHE_TAG);
  return opp;
}

export async function updateVolunteerOpportunity(
  id: string,
  data: {
    title?: string;
    slug?: string;
    department?: string;
    location?: string;
    commitment?: string;
    description?: string;
    requirements?: string[];
    benefits?: string[];
    isActive?: boolean;
  },
) {
  const opp = await db.volunteerOpportunity.update({ where: { id }, data });
  revalidateTag(CACHE_TAG);
  return opp;
}

export async function deleteVolunteerOpportunity(id: string) {
  await db.volunteerOpportunity.delete({ where: { id } });
  revalidateTag(CACHE_TAG);
}

export async function submitVolunteerApplication(data: {
  opportunityId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  motivation?: string;
  availability?: string;
  skills?: string[];
}) {
  return db.volunteerApplication.create({ data });
}

export async function getApplicationsForOpportunity(opportunityId: string) {
  return db.volunteerApplication.findMany({
    where: { opportunityId },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateVolunteerApplicationStatus(
  id: string,
  status: "SUBMITTED" | "APPROVED" | "REJECTED",
) {
  return db.volunteerApplication.update({
    where: { id },
    data: { status },
  });
}
