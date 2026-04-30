"use server";

import { submitApplication, getCareerBySlug } from "@/lib/services/careers";

export async function submitApplicationAction(formData: FormData) {
  const slug = formData.get("slug") as string;
  const career = await getCareerBySlug(slug);

  const educationRaw = formData.get("education") as string;
  const experienceRaw = formData.get("experience") as string;

  await submitApplication({
    careerId: career.id,
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    email: formData.get("email") as string,
    phone: (formData.get("phone") as string) || undefined,
    coverLetter: (formData.get("coverLetter") as string) || undefined,
    resumeUrl: (formData.get("resumeUrl") as string) || undefined,
    linkedinUrl: (formData.get("linkedinUrl") as string) || undefined,
    education: educationRaw ? JSON.parse(educationRaw) : [],
    experience: experienceRaw ? JSON.parse(experienceRaw) : [],
  });
}
