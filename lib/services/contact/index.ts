import { db } from "@/lib/db";

export async function createContactMessage(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  return db.contactMessage.create({ data });
}

export async function getAllContactMessages({ page = 1, perPage = 50 }: { page?: number; perPage?: number } = {}) {
  const [rows, total] = await Promise.all([
    db.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.contactMessage.count(),
  ]);
  return { rows, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

export async function markMessageRead(id: string) {
  return db.contactMessage.update({
    where: { id },
    data: { isRead: true },
  });
}

export async function deleteContactMessage(id: string) {
  return db.contactMessage.delete({ where: { id } });
}
