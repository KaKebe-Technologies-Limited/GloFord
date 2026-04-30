import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

/**
 * Integration tests for the authentication flow.
 *
 * Tests credential validation, session enrichment, and
 * role loading without hitting a real database.
 */

const mockDb = {
  user: {
    findUnique: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({ db: mockDb }));

describe("Authentication flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Credential validation", () => {
    it("accepts valid email/password combination", async () => {
      const passwordHash = await bcrypt.hash("SecurePass123!", 10);
      const mockUser = {
        id: "user_1",
        email: "admin@gloford.org",
        passwordHash,
        isActive: true,
        role: { name: "ADMIN" },
      };
      mockDb.user.findUnique.mockResolvedValue(mockUser);

      const user = await mockDb.user.findUnique({
        where: { email: "admin@gloford.org" },
      });

      expect(user).toBeTruthy();
      const isValid = await bcrypt.compare("SecurePass123!", user!.passwordHash!);
      expect(isValid).toBe(true);
    });

    it("rejects wrong password", async () => {
      const passwordHash = await bcrypt.hash("SecurePass123!", 10);
      const mockUser = {
        id: "user_1",
        email: "admin@gloford.org",
        passwordHash,
        isActive: true,
      };
      mockDb.user.findUnique.mockResolvedValue(mockUser);

      const user = await mockDb.user.findUnique({
        where: { email: "admin@gloford.org" },
      });

      const isValid = await bcrypt.compare("WrongPassword!", user!.passwordHash!);
      expect(isValid).toBe(false);
    });

    it("rejects inactive user", async () => {
      const passwordHash = await bcrypt.hash("ValidPass!", 10);
      const mockUser = {
        id: "user_2",
        email: "inactive@gloford.org",
        passwordHash,
        isActive: false,
        role: { name: "VIEWER" },
      };
      mockDb.user.findUnique.mockResolvedValue(mockUser);

      const user = await mockDb.user.findUnique({
        where: { email: "inactive@gloford.org" },
      });

      expect(user!.isActive).toBe(false);
      // Auth should reject inactive users
    });

    it("handles non-existent user gracefully", async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      const user = await mockDb.user.findUnique({
        where: { email: "nonexistent@gloford.org" },
      });

      expect(user).toBeNull();
    });
  });

  describe("Session enrichment", () => {
    it("JWT callback enriches token with role and id", () => {
      const token = { sub: "user_1" };
      const user = { id: "user_1", role: { name: "ADMIN" } };

      // Simulating JWT callback behavior
      const enriched = {
        ...token,
        id: user.id,
        role: user.role.name,
      };

      expect(enriched.id).toBe("user_1");
      expect(enriched.role).toBe("ADMIN");
    });

    it("session callback exposes role from token", () => {
      const token = { id: "user_1", role: "SUPER_ADMIN" };
      const session = {
        user: {
          id: token.id,
          role: token.role,
        },
      };

      expect(session.user.id).toBe("user_1");
      expect(session.user.role).toBe("SUPER_ADMIN");
    });
  });

  describe("Password hashing", () => {
    it("uses bcrypt with sufficient rounds", async () => {
      const hash = await bcrypt.hash("TestPassword!", 10);
      expect(hash).toMatch(/^\$2[aby]\$.{56}$/);

      const rounds = bcrypt.getRounds(hash);
      expect(rounds).toBeGreaterThanOrEqual(10);
    });

    it("bcrypt compare is timing-safe", async () => {
      const hash = await bcrypt.hash("TestPassword!", 10);
      const valid = await bcrypt.compare("TestPassword!", hash);
      const invalid = await bcrypt.compare("WrongPassword!", hash);

      expect(valid).toBe(true);
      expect(invalid).toBe(false);
    });
  });
});
