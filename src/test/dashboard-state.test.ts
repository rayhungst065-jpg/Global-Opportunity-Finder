import { describe, expect, it } from "vitest";
import { hasExplored } from "@/lib/dashboard-state";

describe("First-time versus returning dashboard", () => {
  it("starts clean for a profile without visits or saved opportunities", () => {
    expect(hasExplored({ preferences: {} }, 0)).toBe(false);
  });
  it("preserves returning content when opportunities are already saved", () => {
    expect(hasExplored({ preferences: {} }, 2)).toBe(true);
  });
  it("remembers a previous catalog visit even without any saves", () => {
    expect(hasExplored({ preferences: { opportunities_explored: true } }, 0)).toBe(true);
  });
  it("does not treat unrelated profile preferences as search activity", () => {
    expect(hasExplored({ preferences: { interests: ["Biology"] } }, 0)).toBe(false);
  });
});