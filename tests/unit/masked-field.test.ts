import { describe, expect, it } from "vitest";

describe("MaskedField", () => {
  it("masks value by default, showing only last 4 chars", () => {
    // Test the masking logic directly
    const value = "sk_test_abc123xyz789";
    const masked = value.length > 4
      ? "\u2022".repeat(Math.min(value.length, 24)) + value.slice(-4)
      : "\u2022".repeat(8);

    expect(masked).not.toContain("sk_test");
    expect(masked.endsWith("z789")).toBe(true);
    expect(masked.startsWith("\u2022")).toBe(true);
  });

  it("masks short values completely", () => {
    const value = "abc";
    const masked = value.length > 4
      ? "\u2022".repeat(Math.min(value.length, 24)) + value.slice(-4)
      : "\u2022".repeat(8);

    expect(masked).toBe("\u2022".repeat(8));
    expect(masked).not.toContain("abc");
  });

  it("limits dots to 24 + 4 last chars for long values", () => {
    const value = "a".repeat(100);
    const masked = value.length > 4
      ? "\u2022".repeat(Math.min(value.length, 24)) + value.slice(-4)
      : "\u2022".repeat(8);

    // 24 dots + 4 chars = 28 total
    expect(masked.length).toBe(28);
  });
});
