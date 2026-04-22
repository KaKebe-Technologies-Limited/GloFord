import { describe, expect, it } from "vitest";
import { blocksSchema, newBlock } from "@/lib/blocks/types";

describe("block registry", () => {
  it("newBlock creates a valid block for every registered type", () => {
    const types = [
      "hero",
      "richText",
      "cta",
      "stats",
      "gallery",
      "donateCta",
      "programGrid",
      "postList",
    ] as const;
    for (const t of types) {
      const b = newBlock(t);
      const result = blocksSchema.safeParse([b]);
      expect(result.success, `type=${t} failed: ${JSON.stringify(result)}`).toBe(true);
    }
  });

  it("rejects an unknown block type", () => {
    const result = blocksSchema.safeParse([
      { id: "x", type: "unknown", data: {} },
    ]);
    expect(result.success).toBe(false);
  });

  it("caps the block list length", () => {
    const many = Array.from({ length: 101 }, () => newBlock("richText"));
    const result = blocksSchema.safeParse(many);
    expect(result.success).toBe(false);
  });
});
