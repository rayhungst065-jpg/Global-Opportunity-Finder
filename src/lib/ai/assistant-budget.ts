/**
 * Shared monthly AI budget for the whole website (all students combined).
 * $10 USD ≈ 10 Lovable credits at provider list price on a monthly plan.
 * The assistant is the only AI feature, so this table covers all AI spend.
 */
export const ASSISTANT_MONTHLY_BUDGET_CREDITS = 10;

/** anthropic/claude-haiku-4-5 via Lovable AI — the lowest-cost built-in model with live web search. */
export const ASSISTANT_MODEL = "anthropic/claude-haiku-4-5";

/** Gateway list pricing in credits (verified against the model catalog). */
export const PRICE_INPUT_PER_TOKEN = 0.000004;
export const PRICE_OUTPUT_PER_TOKEN = 0.00002;
export const PRICE_PER_WEB_SEARCH = 0.04;

export type AssistantUsage = { inputTokens: number; outputTokens: number; webSearchRequests: number };

/** Current UTC month key ("YYYY-MM"); the shared counter resets each calendar month. */
export function monthKeyUtc(date: Date = new Date()) {
  return date.toISOString().slice(0, 7);
}

export function creditsForUsage(usage: AssistantUsage) {
  return usage.inputTokens * PRICE_INPUT_PER_TOKEN + usage.outputTokens * PRICE_OUTPUT_PER_TOKEN + usage.webSearchRequests * PRICE_PER_WEB_SEARCH;
}

export function budgetExceeded(usedCredits: number) {
  return usedCredits >= ASSISTANT_MONTHLY_BUDGET_CREDITS;
}

export function formatBudget(usedCredits: number) {
  return `$${usedCredits.toFixed(2)} used / $${ASSISTANT_MONTHLY_BUDGET_CREDITS.toFixed(2)} monthly limit`;
}
