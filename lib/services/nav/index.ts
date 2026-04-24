import { createService } from "@/lib/services/_shared";
import {
  navCreateSchema,
  navUpdateSchema,
  navDeleteSchema,
  navReorderSchema,
} from "@/lib/validators/nav";
import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";

export const createNavItem = createService({
  module: "nav",
  action: "update",
  schema: navCreateSchema,
  permission: () => ({ type: "NavItem" }),
  exec: async ({ input, tx }) =>
    tx.navItem.create({
      data: {
        location: input.location,
        parentId: input.parentId ?? null,
        label: input.label,
        href: input.href ?? null,
        pageId: input.pageId ?? null,
        order: input.order,
        requiredPermission: input.requiredPermission ?? null,
        isActive: input.isActive,
      },
    }),
});

export const updateNavItem = createService({
  module: "nav",
  action: "update",
  schema: navUpdateSchema,
  permission: () => ({ type: "NavItem" }),
  exec: async ({ input, tx }) => {
    const { id, ...rest } = input;
    const row = await tx.navItem.findUnique({ where: { id } });
    if (!row) throw new NotFoundError("Nav item not found");
    return tx.navItem.update({ where: { id }, data: rest });
  },
});

export const deleteNavItem = createService({
  module: "nav",
  action: "update",
  schema: navDeleteSchema,
  permission: () => ({ type: "NavItem" }),
  exec: async ({ input, tx }) => {
    const row = await tx.navItem.findUnique({ where: { id: input.id } });
    if (!row) throw new NotFoundError("Nav item not found");
    await tx.navItem.delete({ where: { id: input.id } });
    return { id: input.id };
  },
});

export const reorderNavItems = createService({
  module: "nav",
  action: "update",
  schema: navReorderSchema,
  permission: () => ({ type: "NavItem" }),
  exec: async ({ input, tx }) => {
    await Promise.all(
      input.items.map((item) =>
        tx.navItem.update({
          where: { id: item.id },
          data: { order: item.order },
        }),
      ),
    );
    return { count: input.items.length };
  },
});

export function listNavItems() {
  return db.navItem.findMany({
    orderBy: [{ location: "asc" }, { order: "asc" }],
  });
}
