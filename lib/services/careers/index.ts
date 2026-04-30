import { db } from "@/lib/db";
import { revalidateTag, unstable_cache } from "next/cache";

const CACHE_TAG = "careers";

export const getActiveCareers = unstable_cache(
  async () => {
    return db.career.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { applications: true } } },
    });
  },
  ["careers-active"],
  { tags: [CACHE_TAG], revalidate: 3600 },
);

export async function getCareerBySlug(slug: string) {
  return db.career.findUniqueOrThrow({
    where: { slug },
    include: { _count: { select: { applications: true } } },
  });
}

export async function getAllCareers() {
  return db.career.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { applications: true } } },
  });
}

export async function createCareer(data: {
  title: string;
  slug: string;
  department: string;
  location: string;
  type?: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "VOLUNTEER";
  description: string;
  requirements?: string[];
  responsibilities?: string[];
  qualifications?: string[];
  benefits?: string[];
  salaryRange?: string;
  applicationDeadline?: Date;
}) {
  const career = await db.career.create({ data });
  revalidateTag(CACHE_TAG);
  return career;
}

export async function updateCareer(
  id: string,
  data: {
    title?: string;
    slug?: string;
    department?: string;
    location?: string;
    type?: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "VOLUNTEER";
    description?: string;
    requirements?: string[];
    responsibilities?: string[];
    qualifications?: string[];
    benefits?: string[];
    salaryRange?: string | null;
    applicationDeadline?: Date | null;
    isActive?: boolean;
  },
) {
  const career = await db.career.update({ where: { id }, data });
  revalidateTag(CACHE_TAG);
  return career;
}

export async function deleteCareer(id: string) {
  await db.career.delete({ where: { id } });
  revalidateTag(CACHE_TAG);
}

export async function submitApplication(data: {
  careerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  coverLetter?: string;
  resumeUrl?: string;
  linkedinUrl?: string;
  education?: Array<{ institution: string; degree: string; field: string; year: string }>;
  experience?: Array<{ company: string; role: string; duration: string; description: string }>;
  customAnswers?: Record<string, string>;
}) {
  return db.careerApplication.create({ data });
}

export async function getApplicationsForCareer(careerId: string) {
  return db.careerApplication.findMany({
    where: { careerId },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateApplicationStatus(
  id: string,
  status: "SUBMITTED" | "REVIEWING" | "SHORTLISTED" | "INTERVIEW" | "OFFERED" | "REJECTED" | "WITHDRAWN",
  notes?: string,
) {
  return db.careerApplication.update({
    where: { id },
    data: { status, notes },
  });
}
