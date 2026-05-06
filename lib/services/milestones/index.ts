import { db } from "@/lib/db";

export async function getActiveMilestones() {
  return db.milestone.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
}

export async function listMilestones() {
  return db.milestone.findMany({ orderBy: { order: "asc" } });
}

export async function createMilestone(data: {
  year: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  order?: number;
}) {
  return db.milestone.create({ data });
}

export async function updateMilestone(
  id: string,
  data: {
    year?: string;
    title?: string;
    description?: string;
    imageUrl?: string | null;
    order?: number;
    isActive?: boolean;
  },
) {
  return db.milestone.update({ where: { id }, data });
}

export async function deleteMilestone(id: string) {
  return db.milestone.delete({ where: { id } });
}
