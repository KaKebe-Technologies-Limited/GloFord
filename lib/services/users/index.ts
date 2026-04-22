import { createService } from "@/lib/services/_shared";
import {
  userInviteSchema,
  userUpdateRoleSchema,
  userDeactivateSchema,
} from "@/lib/validators/users";
import { db } from "@/lib/db";
import { runAsSystem } from "@/lib/tenant/context";
import { NotFoundError, ConflictError } from "@/lib/errors";
import { inngest } from "@/lib/inngest/client";

/**
 * Invite (or upsert) a user into this organization at a given role.
 *
 * First-time users land with no passwordHash. They'll set one via the
 * magic-link / OAuth flow on first sign-in. The actual email is sent by
 * an Inngest-backed invite function (not in scope here).
 */
export const inviteUser = createService({
  module: "users",
  action: "invite",
  schema: userInviteSchema,
  permission: () => ({ type: "User" }),
  exec: async ({ input, actor, tx }) => {
    const role = await tx.role.findUnique({ where: { name: input.role } });
    if (!role) throw new NotFoundError(`Role ${input.role} not found`);

    const user = await tx.user.upsert({
      where: { email: input.email },
      create: { email: input.email, name: input.name },
      update: { name: input.name ?? undefined },
    });

    const existing = await tx.orgMembership.findUnique({
      where: {
        organizationId_userId: { organizationId: actor.orgId, userId: user.id },
      },
    });
    if (existing) {
      throw new ConflictError("User is already a member of this organization");
    }

    const membership = await tx.orgMembership.create({
      data: { organizationId: actor.orgId, userId: user.id, roleId: role.id },
      include: { user: true, role: true },
    });

    // Fire invite email out-of-band.
    void inngest
      .send({
        name: "user/invite.send",
        data: {
          orgId: actor.orgId,
          email: user.email,
          name: user.name ?? undefined,
        },
      })
      .catch(() => {});

    return membership;
  },
  version: (out) => ({ entityType: "OrgMembership", entityId: out.id }),
});

export const updateUserRole = createService({
  module: "users",
  action: "update",
  schema: userUpdateRoleSchema,
  permission: () => ({ type: "User" }),
  exec: async ({ input, actor, tx }) => {
    const role = await tx.role.findUnique({ where: { name: input.role } });
    if (!role) throw new NotFoundError(`Role ${input.role} not found`);
    const membership = await tx.orgMembership.findUnique({
      where: {
        organizationId_userId: { organizationId: actor.orgId, userId: input.userId },
      },
    });
    if (!membership) throw new NotFoundError("Membership not found");
    return tx.orgMembership.update({
      where: { id: membership.id },
      data: { roleId: role.id },
      include: { user: true, role: true },
    });
  },
  version: (out) => ({ entityType: "OrgMembership", entityId: out.id }),
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
    const membership = await tx.orgMembership.findUnique({
      where: {
        organizationId_userId: { organizationId: actor.orgId, userId: input.userId },
      },
    });
    if (!membership) throw new NotFoundError("Membership not found");
    // Soft-remove: drop the membership for this org but keep the User.
    await tx.orgMembership.delete({ where: { id: membership.id } });
    return { userId: input.userId };
  },
});

export function listOrgUsers(orgId: string) {
  // OrgMembership RLS keys off userId (each user sees their own).
  // Admin listing-all requires the SYSTEM bypass.
  return runAsSystem((tx) =>
    tx.orgMembership.findMany({
      where: { organizationId: orgId },
      include: { user: true, role: true },
      orderBy: { joinedAt: "desc" },
    }),
  );
}

export function listRoles() {
  return db.role.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { memberships: true } } },
  });
}
