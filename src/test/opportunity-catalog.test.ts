import { describe, expect, it } from "vitest";
import { catalogCategories, opportunityAvailability, opportunitySummary, sourceField } from "@/lib/opportunity-catalog";

describe("Approved master catalog facts", () => {
  it("offers exactly the six requested categories", () => {
    expect(catalogCategories.map(c => c.name)).toEqual(["Volunteer", "Competition", "Cultural Exchange", "Research", "Leadership", "Education"]);
    expect(new Set(catalogCategories.map(c => c.key)).size).toBe(6);
  });
  it("uses the master's concise description without replacing the full record", () => {
    const row = { description: "Full description and program purpose.", source_record: { "Short Description": "Join a structured international volunteer project." } };
    expect(opportunitySummary(row)).toBe("Join a structured international volunteer project.");
    expect(row.description).toBe("Full description and program purpose.");
  });
  it("never converts international reach into confirmed eligibility", () => {
    const record = { "International Reach": "International network", "International Accessibility": "International eligibility not confirmed" };
    expect(sourceField(record, "International Accessibility")).toBe("International eligibility not confirmed");
    expect(sourceField(record, "Minimum Age")).toBeUndefined();
    expect(sourceField(record, "Last Verified Date")).toBeUndefined();
  });
  it("does not infer open status from a typical application period", () => {
    expect(opportunityAvailability({ description: "Volunteering", source_record: { "Typical Application Period": "Ongoing" } })).toBe("Not confirmed");
    expect(opportunityAvailability({ description: "Existing legitimate listing", source_record: null })).toBeUndefined();
  });
  it("preserves the original description when there is no master record", () => {
    expect(opportunitySummary({ description: "Original private listing" })).toBe("Original private listing");
    expect(sourceField([], "Cost")).toBeUndefined();
  });
});