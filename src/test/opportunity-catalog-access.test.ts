import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => {
  const query: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ["select", "order", "is", "eq", "or"]) query[method] = vi.fn(() => query);
  query["then"] = vi.fn((resolve) => resolve({ data: [], error: null }));
  return { query, from: vi.fn(() => query) };
});
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => {
  const builder = {
    middleware: () => builder,
    inputValidator: (validate: (data: unknown) => unknown) => ({
      handler: (handler: (input: unknown) => unknown) => (input: { data: unknown }) => handler({ data: validate(input.data), context: { supabase: { from: db.from } } }),
    }),
  };
  return builder;
} }));
import { listOpportunities } from "@/lib/opportunities.functions";

beforeEach(() => vi.clearAllMocks());
describe("Shared Explore read path", () => {
  it("lists only ownerless catalog records, never private AI-origin rows", async () => {
    await listOpportunities({ data: {} });
    expect(db.from).toHaveBeenCalledWith("opportunities");
    expect(db.query["is"]).toHaveBeenCalledWith("owner_user_id", null);
  });
  it.each(["cultural_exchange", "leadership", "education"] as const)("filters the actual %s category without remapping it", async (category) => {
    await listOpportunities({ data: { category } });
    expect(db.query["eq"]).toHaveBeenCalledWith("category", category);
  });
  it("keeps title, organizer and description search", async () => {
    await listOpportunities({ data: { q: "CERN" } });
    expect(db.query["or"]).toHaveBeenCalledWith("title.ilike.%CERN%,organizer.ilike.%CERN%,description.ilike.%CERN%");
  });
});