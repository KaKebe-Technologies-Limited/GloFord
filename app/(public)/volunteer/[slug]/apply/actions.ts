"use server";

import { submitVolunteerApplication } from "@/lib/services/volunteer";

export async function submitVolunteerApplicationAction(formData: FormData) {
  const skillsRaw = (formData.get("skills") as string) || "";
  const skills = skillsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  await submitVolunteerApplication({
    opportunityId: formData.get("opportunityId") as string,
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    email: formData.get("email") as string,
    phone: (formData.get("phone") as string) || undefined,
    motivation: (formData.get("motivation") as string) || undefined,
    availability: (formData.get("availability") as string) || undefined,
    skills,
  });
}
