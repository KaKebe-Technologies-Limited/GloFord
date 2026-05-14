import { describe, it, expect, vi } from "vitest";

describe("Health API", () => {
  it("returns healthy when DB is connected", async () => {
    vi.doMock("@/lib/db", () => ({
      db: {
        $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]),
      },
    }));

    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("healthy");
    expect(body.db).toBe("connected");
    expect(body).toHaveProperty("uptime");
    expect(body).toHaveProperty("latencyMs");
  });

  it("returns unhealthy when DB is disconnected", async () => {
    vi.doMock("@/lib/db", () => ({
      db: {
        $queryRaw: vi.fn().mockRejectedValue(new Error("Connection refused")),
      },
    }));

    // Force re-import after mock change
    vi.resetModules();
    vi.doMock("@/lib/db", () => ({
      db: {
        $queryRaw: vi.fn().mockRejectedValue(new Error("Connection refused")),
      },
    }));

    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("unhealthy");
    expect(body.db).toBe("disconnected");
  });
});
