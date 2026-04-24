import { createService } from "@/lib/services/_shared";
import {
  userInviteSchema,
  userUpdateRoleSchema,
  userDeactivateSchema,
} from "@/lib/validators/users";
import { db } from "@/lib/db";
import { NotFoundError, ConflictError } from "@/lib/errors";
import { inngest } from "@/lib/inngest/client";

/**
 * Invite a user. No multi-tenant membership table — the user simply
 * gets a row on the User table with the given role. First-time users
 * land with no passwordHash and set one via the invite email / OAuth.
 */
export const inviteUser = createService({
  module: "users",
  action: "invite",
  schema: userInviteSchema,
  permission: () => ({ type: "User" }),
  exec: async ({ input, tx }) => {
    const role = await tx.role.findUnique({ where: { name: input.role } });
    if (!role) throw new NotFoundError(`Role ${input.role} not found`);

    const existing = await tx.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictError("A user with this email already exists");

    const user = await tx.user.create({
      data: {
        email: input.email,
        name: input.name,
        roleId: role.id,
      },
      include: { role: true },
    });

    void inngest
      .send({
        name: "user/invite.send",
        data: { email: user.email, name: user.name ?? undefined },
      })
      .catch(() => {});

    return user;
  },
  version: (out) => ({ entityType: "User", entityId: out.id }),
});

export const updateUserRole = createService({
  module: "users",
  action: "update",
  schema: userUpdateRoleSchema,
  permission: () => ({ type: "User" }),
  exec: async ({ input, tx }) => {
    const role = await tx.role.findUnique({ where: { name: input.role } });
    if (!role) throw new NotFoundError(`Role ${input.role} not found`);
    const user = await tx.user.findUnique({ where: { id: input.userId } });
    if (!user) throw new NotFoundError("User not found");
    return tx.user.update({
      where: { id: input.userId },
      data: { roleId: role.id },
      include: { role: true },
    });
  },
  version: (out) => ({ entityType: "User", entityId: out.id }),
});

export const deactivateUser = createService({
  module: "users",
  action: "deactivate",
  schema: userDeactivateSchema,
  permission: () => ({ type: "User" }),
  exec: async ({ input, actor, tx }) => {
    if (input.userId === actor.userId) {
      throw new ConflictError("You cannot deactivate yourself");
    }
    const user = await tx.user.findUnique({ where: { id: input.userId } });
    if (!user) throw new NotFoundError("User not found");
    await tx.user.update({
      where: { id: input.userId },
      data: { isActive: false },
    });
    return { userId: input.userId };
  },
});

export function listOrgUsers() {
  return db.user.findMany({
    where: { isActive: true },
    include: { role: true },
    orderBy: { createdAt: "desc" },
  });
}

export function listRoles() {
  return db.role.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true } } },
  });
}
