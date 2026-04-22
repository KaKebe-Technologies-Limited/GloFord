import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/services/exports/csv";

describe("toCsv", () => {
  it("returns empty string for no rows", () => {
    expect(toCsv([])).toBe("");
  });

  it("writes headers from the first row", () => {
    const out = toCsv([{ a: 1, b: 2 }]);
    const [header] = out.split("\r\n");
    expect(header).toBe("a,b");
  });

  it("escapes commas, quotes, and newlines", () => {
    const out = toCsv([{ a: 'has, "quotes" and\nnewlines', b: 1 }]);
    expect(out).toContain('"has, ""quotes"" and\nnewlines"');
  });

  it("stringifies objects and dates", () => {
    const out = toCsv([{ at: new Date("2026-04-21T00:00:00Z"), meta: { x: 1 } }]);
    expect(out).toContain("2026-04-21T00:00:00.000Z");
    expect(out).toContain('"{""x"":1}"');
  });

  it("passes through null/undefined as empty", () => {
    const out = toCsv([{ a: null, b: undefined }]);
    const [, body] = out.split("\r\n");
    expect(body).toBe(",");
  });
});
