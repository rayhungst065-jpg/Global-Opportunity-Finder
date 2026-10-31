import { describe, expect, it } from "vitest";
import { opportunityDestination, readFeatureDestination } from "@/lib/auth-destination";

describe("Homepage sign-in return", () => {
  it("returns College Search after sign-in", () => expect(readFeatureDestination("/college-match")).toBe("/college-match"));
  it("returns Meet Students after sign-in", () => expect(readFeatureDestination("/meet-students")).toBe("/meet-students"));
  it("returns Explore after sign-in", () => expect(readFeatureDestination("/opportunities")).toBe("/opportunities"));
  it("waits for identity rather than sending a loading user to login", () => {
    expect(opportunityDestination(false, false)).toBeUndefined();
    expect(opportunityDestination(false, true)).toBeUndefined();
  });
  it("takes signed-in students straight to Explore", () => expect(opportunityDestination(true, true)).toBe("/opportunities"));
  it("takes signed-out visitors to the existing login flow", () => expect(opportunityDestination(true, false)).toBe("/login"));
  it("rejects external or unrelated destinations", () => {
    expect(readFeatureDestination("https://example.com")).toBeUndefined();
    expect(readFeatureDestination("//example.com")).toBeUndefined();
    expect(readFeatureDestination("/admin")).toBeUndefined();
  });
});