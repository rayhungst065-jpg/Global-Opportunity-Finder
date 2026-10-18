import { describe, expect, it } from "vitest";
import { collegeCriteriaSchema, criteriaKey, validateCollegeEvidence, generalLiveSearchUnavailable, type CollegeResult } from "@/lib/college-research-policy";
import { verificationState } from "@/lib/opportunity-source";

const criteria = { intended_major: "Physics", preferred_regions: ["Europe", "Asia"], institution_types: ["Public", "Private"], campus_size: "", budget_range: "", financial_aid_interest: false };
const source = { url: "https://college.example.edu/admissions", title: "Example College", excerpts: ["Example College offers Physics. Tuition: USD 100 for 2026."] };
const row: CollegeResult = { institution: "Example College", institution_evidence: "Example College offers Physics.", source_url: source.url, official_source: true, facts: [{ label: "Tuition", value: "USD 100", evidence: "Tuition: USD 100 for 2026." }], fit: "Offers the selected subject.", missing_information: ["Aid eligibility"], checked_at: "AI date" };

describe("college research safeguards", () => {
  it("reuses equivalent selected criteria regardless of option order", () => {
    expect(criteriaKey(criteria)).toBe(criteriaKey({ ...criteria, preferred_regions: [...criteria.preferred_regions].reverse(), institution_types: [...criteria.institution_types].reverse() }));
  });
  it("requires selected criteria before research", () => {
    expect(collegeCriteriaSchema.safeParse({ ...criteria, intended_major: "", preferred_regions: [], institution_types: [] }).success).toBe(false);
  });
  it("never preserves unsupported AI facts", () => {
    const results = validateCollegeEvidence([{ ...row, facts: [...row.facts, { label: "Aid", value: "Full scholarship", evidence: "Full scholarship" }] }], [source], "2026-10-18T00:00:00Z");
    expect(results[0]?.facts).toEqual(row.facts);
  });
  it("requires institution evidence and an exact extracted source URL", () => {
    expect(validateCollegeEvidence([{ ...row, institution: "Invented University" }, { ...row, source_url: "https://other.example.edu" }], [source], "2026-10-18")).toEqual([]);
  });
  it("excludes directories and duplicate institutions", () => {
    expect(validateCollegeEvidence([{ ...row, official_source: false }], [source], "2026-10-18")).toEqual([]);
    expect(validateCollegeEvidence([row, row], [source], "2026-10-18")).toHaveLength(1);
  });
  it("general live search is unavailable with no results", () => {
    expect(generalLiveSearchUnavailable()).toMatchObject({ available: false, results: [] });
  });
});

describe("saved deadline and source dates", () => {
  it("flags a passed stored deadline without changing it", () => {
    expect(verificationState("2026-10-17", "2026-10-01", "2026-10-18")).toBe("Stored deadline has passed — needs verification");
  });
  it("does not treat an unknown source timestamp as verified", () => {
    expect(verificationState(null, "2026-11-01", "2026-10-18")).toBe("Verification date unknown — confirm official details");
  });
  it("flags stale stored evidence", () => {
    expect(verificationState("2026-09-01", null, "2026-10-18")).toBe("Source check is over 30 days old — needs verification");
  });
});