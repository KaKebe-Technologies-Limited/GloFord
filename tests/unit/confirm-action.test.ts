import { describe, expect, it } from "vitest";

describe("ConfirmAction logic", () => {
  function isConfirmDisabled(required: string | undefined, typed: string): boolean {
    return required ? typed !== required : false;
  }

  it("requireTypedConfirmation blocks confirm when text does not match", () => {
    expect(isConfirmDisabled("delete-my-org", "delete-my")).toBe(true);
  });

  it("requireTypedConfirmation allows confirm when text matches exactly", () => {
    expect(isConfirmDisabled("delete-my-org", "delete-my-org")).toBe(false);
  });

  it("confirm is not disabled when requireTypedConfirmation is undefined", () => {
    expect(isConfirmDisabled(undefined, "")).toBe(false);
  });
});
