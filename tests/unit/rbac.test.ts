import { describe, expect, it } from "vitest";
import { PERMISSIONS, resolveRolePermissions } from "@/lib/rbac/permissions";

describe("RBAC role matrix", () => {
  it("SUPER_ADMIN has every permission", () => {
    const perms = resolveRolePermissions("SUPER_ADMIN");
    expect(perms.length).toBe(PERMISSIONS.length);
  });

  it("VIEWER cannot create pages", () => {
    const perms = resolveRolePermissions("VIEWER");
    expect(perms.find((p) => p.key === "pages.create")).toBeUndefined();
    expect(perms.find((p) => p.key === "pages.read")).toBeDefined();
  });

  it("EDITOR can publish posts but not refund donations", () => {
    const perms = resolveRolePermissions("EDITOR");
    expect(perms.find((p) => p.key === "posts.publish")).toBeDefined();
    expect(perms.find((p) => p.key === "donations.refund")).toBeUndefined();
  });

  it("ADMIN can refund donations", () => {
    const perms = resolveRolePermissions("ADMIN");
    expect(perms.find((p) => p.key === "donations.refund")).toBeDefined();
  });

  it("permission keys are unique", () => {
    const seen = new Set<string>();
    for (const p of PERMISSIONS) {
      expect(seen.has(p.key)).toBe(false);
      seen.add(p.key);
    }
  });
});
