import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCareerBySlug } from "@/lib/services/careers";
import { CareerApplyForm } from "./CareerApplyForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const career = await getCareerBySlug(slug);
    return { title: `Apply: ${career.title}` };
  } catch {
    return { title: "Apply" };
  }
}

export default async function CareerApplyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let career;
  try {
    career = await getCareerBySlug(slug);
  } catch {
    notFound();
  }

  return (
    <CareerApplyForm
      slug={slug}
      jobTitle={career.title}
      department={career.department}
      location={career.location}
      type={career.type}
      requirements={career.requirements as string[]}
    />
  );
}
