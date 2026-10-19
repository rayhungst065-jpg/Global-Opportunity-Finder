import { describe, expect, it } from "vitest";
import { readFeatureDestination } from "@/lib/auth-destination";

describe("Homepage sign-in return", () => {
  it("returns College Search after sign-in", () => expect(readFeatureDestination("/college-match")).toBe("/college-match"));
  it("returns Meet Students after sign-in", () => expect(readFeatureDestination("/meet-students")).toBe("/meet-students"));
  it("rejects external or unrelated destinations", () => {
    expect(readFeatureDestination("https://example.com")).toBeUndefined();
    expect(readFeatureDestination("//example.com")).toBeUndefined();
    expect(readFeatureDestination("/admin")).toBeUndefined();
  });
});