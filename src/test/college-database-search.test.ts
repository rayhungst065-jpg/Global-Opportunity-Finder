import { describe, it, expect, vi } from "vitest";
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => ({ middleware: () => ({ inputValidator: (validate: (v: unknown) => unknown) => ({ handler: (handler: (v: unknown) => unknown) => (input: { data: unknown }) => handler({ data: validate(input.data), context: { supabase: { rpc } } }) }) }) }) }));
import { searchColleges } from "@/lib/colleges.functions";
describe("spreadsheet-only college search", () => {
  it("passes selected search/filter/sort to the database without external requests", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    rpc.mockResolvedValue({ data: { rows: [], total: 0, regions: ["Asia"], countries: ["Canada"], types: ["Public"] }, error: null });
    await searchColleges({ data: { query: "Toronto", region: "North America", country: "Canada", type: "Public", sort: "rank", page: 1 } });
    expect(rpc).toHaveBeenCalledWith("search_colleges", { p_query: "Toronto", p_region: "North America", p_country: "Canada", p_type: "Public", p_sort: "rank", p_page: 1 });
    expect(fetchSpy).not.toHaveBeenCalled(); fetchSpy.mockRestore();
  });
  it("preserves spreadsheet N/A and approximate values unchanged", async () => {
    rpc.mockResolvedValue({ data: { rows: [{ id: "row", university: "Original university", qs_rank: "~100–250", region: "Asia", country: "Original country", institution_type: "Public", tuition: "N/A", campus_size: null, gpa_requirement: "N/A", acceptance_rate: null, official_website: null, enrollment: "14000" }], total: 1, regions: [], countries: [], types: [] }, error: null });
    const result = await searchColleges({ data: {} } as Parameters<typeof searchColleges>[0]);
    expect(result.rows[0]?.tuition).toBe("N/A"); expect(result.rows[0]?.qs_rank).toBe("~100–250"); expect(result.rows[0]?.campus_size).toBeNull();
  });
});