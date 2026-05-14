import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

// vi.mock factories must not reference top-level variables
vi.mock("@/lib/db", () => ({
  db: { $transaction: (fn: Function) => fn({}) },
}));
vi.mock("@/lib/rbac/authorize", () => ({
  authorize: vi.fn(),
}));
vi.mock("@/lib/inngest/client", () => ({
  inngest: { send: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureException: vi.fn(),
}));
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: (key: string) => (key === "x-correlation-id" ? "test-corr-123" : null),
  }),
}));

import { createService } from "@/lib/services/_shared/createService";
import { authorize } from "@/lib/rbac/authorize";
import { inngest } from "@/lib/inngest/client";

const mockAuthorize = vi.mocked(authorize);
const mockInngest = vi.mocked(inngest);

describe("createService", () => {
  const testSchema = z.object({
    name: z.string().min(1),
    value: z.number(),
  });

  const actor = {
    userId: "user_1",
    role: "ADMIN",
    roleId: "role_1",
    email: "admin@test.com",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthorize.mockResolvedValue(undefined);
  });

  it("validates input via schema and rejects invalid data", async () => {
    const svc = createService({
      module: "test",
      action: "create",
      schema: testSchema,
      permission: () => ({ type: "Test" }),
      exec: async () => ({ id: "1" }),
    });

    await expect(svc(actor, { name: "", value: 0 })).rejects.toThrow();
  });

  it("calls authorize with correct module.action", async () => {
    const svc = createService({
      module: "posts",
      action: "create",
      schema: testSchema,
      permission: () => ({ type: "Post" }),
      exec: async () => ({ id: "1" }),
    });

    await svc(actor, { name: "test", value: 1 });
    expect(mockAuthorize).toHaveBeenCalledWith(actor, "posts.create", { type: "Post" });
  });

  it("executes the service function with parsed input", async () => {
    const execFn = vi.fn().mockResolvedValue({ id: "new_1", name: "test" });

    const svc = createService({
      module: "test",
      action: "create",
      schema: testSchema,
      permission: () => ({ type: "Test" }),
      exec: execFn,
    });

    const result = await svc(actor, { name: "test", value: 42 });

    expect(execFn).toHaveBeenCalledWith(
      expect.objectContaining({
        actor,
        input: { name: "test", value: 42 },
      }),
    );
    expect(result).toEqual({ id: "new_1", name: "test" });
  });

  it("sends audit event via inngest", async () => {
    const svc = createService({
      module: "pages",
      action: "update",
      schema: testSchema,
      permission: () => ({ type: "Page" }),
      exec: async () => ({ id: "page_1" }),
    });

    await svc(actor, { name: "test", value: 1 });

    expect(mockInngest.send).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "audit/log",
        data: expect.objectContaining({
          action: "pages.update",
          module: "pages",
        }),
      }),
    );
  });

  it("sends versioning event when version hook returns ref", async () => {
    const svc = createService({
      module: "pages",
      action: "update",
      schema: testSchema,
      permission: () => ({ type: "Page" }),
      exec: async () => ({ id: "page_1" }),
      version: (out) => ({ entityType: "Page", entityId: (out as { id: string }).id }),
    });

    await svc(actor, { name: "test", value: 1 });

    // Should have sent 2 events: audit + versioning
    expect(mockInngest.send).toHaveBeenCalledTimes(2);
  });

  it("throws when authorize rejects", async () => {
    mockAuthorize.mockRejectedValue(new Error("Forbidden"));

    const svc = createService({
      module: "test",
      action: "delete",
      schema: testSchema,
      permission: () => ({ type: "Test" }),
      exec: async () => ({ id: "1" }),
    });

    await expect(svc(actor, { name: "x", value: 1 })).rejects.toThrow("Forbidden");
  });

  it("calls loadBefore hook when provided", async () => {
    const loadBefore = vi.fn().mockResolvedValue({ id: "old_1", name: "old" });

    const svc = createService({
      module: "test",
      action: "update",
      schema: testSchema,
      permission: () => ({ type: "Test" }),
      loadBefore,
      exec: async () => ({ id: "1" }),
    });

    await svc(actor, { name: "test", value: 1 });
    expect(loadBefore).toHaveBeenCalled();
  });
});
