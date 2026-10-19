import { describe, it, expect } from "vitest";
import { upcomingOf } from "@/lib/saved-list";
import { formatDeadline } from "@/components/site/OpportunityCard";
import { chatRecommendationSchema, normalizeChatRecommendation } from "@/lib/chat-recommendation";

describe("deadline display rules", () => {
  it("shows a confirmed date when present", () => {
    expect(formatDeadline("2027-03-15", null)).toContain("2027");
  });
  it("labels approximate deadlines as estimated", () => {
    expect(formatDeadline(null, "mid-July")).toBe("Estimated: mid-July");
  });
  it("never invents a date when none is available", () => {
    expect(formatDeadline(null, null)).toBe("Deadline not available");
  });
});

describe("upcoming saved deadlines", () => {
  const item = (deadline: string | null, deadline_estimate: string | null = null) => ({ opportunity: { deadline, deadline_estimate } });
  it("sorts confirmed deadlines by date and appends estimates after them", () => {
    const result = upcomingOf([item(null, "late August"), item("2099-06-01"), item("2099-01-01")]);
    expect(result.map(r => r.opportunity.deadline)).toEqual(["2099-01-01", "2099-06-01", null]);
  });
  it("excludes past deadlines and items with no date or estimate", () => {
    expect(upcomingOf([item("2000-01-01"), item(null, null)])).toEqual([]);
  });
});

describe("chat recommendation schema", () => {
  it("accepts stored recommendations without the newer fields", () => {
    const parsed = chatRecommendationSchema.safeParse({ name: "X", description: "Y", deadline: null, officialUrl: null, reason: "Z", catalogId: null });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.category).toBe("awards");
      expect(parsed.data.deadlineEstimate).toBeNull();
    }
  });
  it("strips unsafe official URLs", () => {
    const parsed = chatRecommendationSchema.parse({ name: "X", description: "Y", deadline: null, officialUrl: "http://localhost/x", reason: "Z", catalogId: null });
    expect(normalizeChatRecommendation(parsed).officialUrl).toBeNull();
  });
});
