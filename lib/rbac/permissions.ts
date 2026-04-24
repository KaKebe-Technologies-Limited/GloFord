/**
 * Canonical permission catalog.
 *
 * The seed script (prisma/seed.ts) upserts these into the Permission
 * table and wires them to roles per the matrix below. Edit here, run
 * `pnpm db:seed` to apply.
 */

import type { PermScope, RoleName } from "@prisma/client";

export type PermissionSpec = {
  key: string;
  module: string;
  action: string;
  resourceType?: string;
  scope: PermScope;
  description?: string;
};

const p = (
  module: string,
  action: string,
  opts: { resourceType?: string; scope?: PermScope; description?: string } = {},
): PermissionSpec => ({
  key: `${module}.${action}`,
  module,
  action,
  resourceType: opts.resourceType,
  scope: opts.scope ?? "GLOBAL",
  description: opts.description,
});

export const PERMISSIONS: PermissionSpec[] = [
  // Content
  p("pages", "read"), p("pages", "create"), p("pages", "update"), p("pages", "delete"), p("pages", "publish"),
  p("programs", "read"), p("programs", "create"), p("programs", "update"), p("programs", "delete"), p("programs", "publish"),
  p("posts", "read"), p("posts", "create"), p("posts", "update"), p("posts", "delete"), p("posts", "publish"),
  p("media", "read"), p("media", "upload"), p("media", "delete"),
  // Donations
  p("campaigns", "read"), p("campaigns", "create"), p("campaigns", "update"), p("campaigns", "delete"),
  p("donations", "read"), p("donations", "refund"), p("donations", "export"),
  p("donors", "read"), p("donors", "export"),
  // Communications
  p("subscribers", "read"), p("subscribers", "create"), p("subscribers", "update"), p("subscribers", "delete"), p("subscribers", "export"),
  p("segments", "read"), p("segments", "create"), p("segments", "update"), p("segments", "delete"),
  p("newsletters", "read"), p("newsletters", "create"), p("newsletters", "update"), p("newsletters", "delete"), p("newsletters", "send"),
  p("emailCampaigns", "read"), p("emailCampaigns", "create"), p("emailCampaigns", "update"), p("emailCampaigns", "delete"), p("emailCampaigns", "activate"),
  p("events", "read"), p("events", "create"), p("events", "update"), p("events", "delete"),
  // Admin
  p("users", "read"), p("users", "invite"), p("users", "update"), p("users", "deactivate"),
  p("roles", "read"), p("roles", "update"),
  p("settings", "read"), p("settings", "update"),
  p("settings", "managePayments"),
  p("theme", "read"), p("theme", "update"),
  p("nav", "read"), p("nav", "update"),
  p("featureFlags", "read"), p("featureFlags", "update"),
  // Observability
  p("audit", "read"),
  p("versions", "read"), p("versions", "restore"),
  p("deadLetter", "read"), p("deadLetter", "retry"),
];

/**
 * Role matrix. A role gets either "*" (all permissions in the module)
 * or an explicit list of action names.
 */
type ModuleGrant = "*" | string[];
export const ROLE_MATRIX: Record<RoleName, Record<string, ModuleGrant>> = {
  SUPER_ADMIN: Object.fromEntries(
    [...new Set(PERMISSIONS.map((x) => x.module))].map((m) => [m, "*" as const]),
  ),
  ADMIN: {
    pages: "*", programs: "*", posts: "*", media: "*",
    campaigns: "*", donations: ["read", "export", "refund"], donors: ["read", "export"],
    subscribers: "*", segments: "*", newsletters: "*", emailCampaigns: "*", events: "*",
    users: ["read", "invite", "update", "deactivate"],
    theme: "*", nav: "*",
    audit: ["read"], versions: ["read", "restore"], deadLetter: ["read", "retry"],
  },
  EDITOR: {
    pages: ["read", "create", "update", "publish"],
    programs: ["read", "create", "update", "publish"],
    posts: ["read", "create", "update", "publish"],
    media: ["read", "upload"],
    subscribers: ["read"],
    segments: ["read"],
    newsletters: ["read", "create", "update"],
    emailCampaigns: ["read"],
    events: ["read", "create", "update"],
    theme: ["read"],
    nav: ["read"],
  },
  VIEWER: {
    pages: ["read"], programs: ["read"], posts: ["read"], media: ["read"],
    campaigns: ["read"], donations: ["read"], donors: ["read"],
    subscribers: ["read"], segments: ["read"], newsletters: ["read"],
    emailCampaigns: ["read"], events: ["read"],
    audit: ["read"], versions: ["read"], deadLetter: ["read"],
    theme: ["read"], nav: ["read"],
  },
};

export function resolveRolePermissions(role: RoleName): PermissionSpec[] {
  const matrix = ROLE_MATRIX[role];
  return PERMISSIONS.filter((perm) => {
    const grant = matrix[perm.module];
    if (!grant) return false;
    return grant === "*" || grant.includes(perm.action);
  });
}
