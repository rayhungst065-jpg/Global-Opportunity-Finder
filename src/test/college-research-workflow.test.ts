import { afterEach, describe, expect, it, vi } from "vitest";
const { generate, provider } = vi.hoisted(() => ({ generate: vi.fn(), provider: vi.fn(() => vi.fn(() => "gemini")) }));
vi.mock("ai", () => ({ generateText: generate, Output: { object: (options: unknown) => options } }));
vi.mock("@/lib/ai/gemini.server", () => ({ geminiProvider: provider, GEMINI_MODEL: "gemini-3.8-flash" }));
import { runCollegeResearch } from "@/lib/college-research.server";
import { discoverOnlineOpportunities } from "@/lib/online-opportunities.server";

const criteria = { intended_major: "Physics", preferred_regions: [], institution_types: [], campus_size: "", budget_range: "", financial_aid_interest: false };
const keys = { gateway: "test-gateway", parallel: "test-parallel", gemini: "test-gemini" };
const source = { url: "https://college.example.edu", title: "Example College", excerpts: ["Example College offers Physics."] };
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe("premium request isolation and bounds", () => {
  it("legacy opportunity discovery never calls a provider", async () => {
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    expect(await discoverOnlineOpportunities()).toMatchObject({ available: false, results: [] });
    expect(fetchMock).not.toHaveBeenCalled(); expect(generate).not.toHaveBeenCalled();
  });
  it("stops after one failed search without retry or Gemini fallback", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("Unavailable", { status: 429 })); vi.stubGlobal("fetch", fetchMock);
    await expect(runCollegeResearch(criteria, keys)).rejects.toThrow("HTTP 429");
    expect(fetchMock).toHaveBeenCalledTimes(1); expect(generate).not.toHaveBeenCalled();
  });
  it("stops when search has no usable source", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ results: [] })); vi.stubGlobal("fetch", fetchMock);
    expect((await runCollegeResearch(criteria, keys)).results).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1); expect(generate).not.toHaveBeenCalled();
  });
  it("bounds a successful research action to search, extraction, one Gemini comparison and three pages", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ results: [source, source, source, source] })); vi.stubGlobal("fetch", fetchMock);
    generate.mockResolvedValue({ output: { colleges: [{ institution: "Example College", institution_evidence: source.excerpts[0], source_url: source.url, official_source: true, facts: [], fit: "Offers Physics", missing_information: [], checked_at: "ignored" }] } });
    const result = await runCollegeResearch(criteria, keys);
    expect(fetchMock).toHaveBeenCalledTimes(2); expect(generate).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).urls).toHaveLength(3);
    expect(generate.mock.calls[0][0].maxRetries).toBe(0);
    expect(result.results).toHaveLength(1);
  });
});