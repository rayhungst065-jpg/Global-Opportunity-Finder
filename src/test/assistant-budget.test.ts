import { describe, expect, it } from "vitest";
import { ASSISTANT_MONTHLY_BUDGET_CREDITS, budgetExceeded, creditsForUsage, formatBudget, monthKeyUtc, PRICE_INPUT_PER_TOKEN, PRICE_OUTPUT_PER_TOKEN, PRICE_PER_WEB_SEARCH } from "@/lib/ai/assistant-budget";

describe("assistant budget", () => {
  it("caps the shared monthly budget at 20 credits ($20)", () => {
    expect(ASSISTANT_MONTHLY_BUDGET_CREDITS).toBe(20);
  });

  it("computes credits from tokens and web searches at catalog list prices", () => {
    const credits = creditsForUsage({ inputTokens: 25_000, outputTokens: 2_000, webSearchRequests: 2 });
    expect(credits).toBeCloseTo(25_000 * PRICE_INPUT_PER_TOKEN + 2_000 * PRICE_OUTPUT_PER_TOKEN + 2 * PRICE_PER_WEB_SEARCH, 10);
    expect(credits).toBeCloseTo(0.22, 10);
  });

  it("counts zero usage as zero credits", () => {
    expect(creditsForUsage({ inputTokens: 0, outputTokens: 0, webSearchRequests: 0 })).toBe(0);
  });

  it("blocks exactly at the limit and not before", () => {
    expect(budgetExceeded(19.99)).toBe(false);
    expect(budgetExceeded(20)).toBe(true);
    expect(budgetExceeded(20.01)).toBe(true);
  });

  it("uses the UTC calendar month as the reset key", () => {
    expect(monthKeyUtc(new Date("2026-11-07T19:00:00Z"))).toBe("2026-11");
    expect(monthKeyUtc(new Date("2026-11-30T23:59:59Z"))).toBe("2026-11");
    expect(monthKeyUtc(new Date("2026-12-01T00:00:00Z"))).toBe("2026-12");
  });

  it("formats the budget line as dollars used of the $20 monthly limit", () => {
    expect(formatBudget(0)).toBe("$0.00 used / $20.00 monthly limit");
    expect(formatBudget(3.456)).toBe("$3.46 used / $20.00 monthly limit");
  });
});
