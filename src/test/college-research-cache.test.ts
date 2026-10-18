import { afterEach, describe, expect, it, vi } from "vitest";
const { workflow, rpc } = vi.hoisted(() => ({ workflow: vi.fn(), rpc: vi.fn() }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/lib/college-research.server", () => ({ runCollegeResearch: workflow }));
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => ({ middleware: () => ({ inputValidator: (validate: (v: unknown) => unknown) => ({ handler: (handler: (v: unknown) => unknown) => (input: { data: unknown }) => handler({ data: validate(input.data), context: { userId: "11111111-1111-4111-8111-111111111111", supabase: { rpc } } }) }) }) }) }));
import { researchColleges } from "@/lib/college-research.functions";
const criteria = { intended_major: "Physics", preferred_regions: [], institution_types: [], campus_size: "", budget_range: "", financial_aid_interest: false };
afterEach(() => vi.clearAllMocks());
describe("owner-scoped research reuse and reservations", () => {
  it("returns cached results without premium requests", async () => {
    rpc.mockResolvedValue({ data: { allowed: false, cached: true, row: { id: "22222222-2222-4222-8222-222222222222", user_id: "11111111-1111-4111-8111-111111111111" } }, error: null });
    const result = await researchColleges({ data: { criteria, confirmPremiumSearch: true } });
    expect(result.cached).toBe(true); expect(workflow).not.toHaveBeenCalled();
  });
  it("stops at daily-limit or concurrent-request denial", async () => {
    rpc.mockResolvedValue({ data: { allowed: false, cached: false, message: "Daily limit reached" }, error: null });
    expect((await researchColleges({ data: { criteria, confirmPremiumSearch: true } })).id).toBeUndefined();
    expect(workflow).not.toHaveBeenCalled();
  });
  it("rejects an owner mismatch before provider calls", async () => {
    rpc.mockResolvedValue({ data: { allowed: true, cached: false, row: { id: "22222222-2222-4222-8222-222222222222", user_id: "33333333-3333-4333-8333-333333333333" } }, error: null });
    expect((await researchColleges({ data: { criteria, confirmPremiumSearch: true } })).id).toBeUndefined();
    expect(workflow).not.toHaveBeenCalled();
  });
});