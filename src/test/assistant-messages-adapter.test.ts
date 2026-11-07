import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import { uiMessagesToAnthropic } from "@/lib/ai/messages-adapter";

const noopRun = async () => ({ ok: true });

describe("uiMessagesToAnthropic", () => {
  it("converts user text messages", async () => {
    const messages = [{ id: "1", role: "user", parts: [{ type: "text", text: "Find volunteer work" }] }] as UIMessage[];
    const out = await uiMessagesToAnthropic(messages, noopRun);
    expect(out).toEqual([{ role: "user", content: [{ type: "text", text: "Find volunteer work" }] }]);
  });

  it("pairs tool calls with their stored outputs as tool results", async () => {
    const messages = [
      { id: "1", role: "user", parts: [{ type: "text", text: "hi" }] },
      { id: "2", role: "assistant", parts: [
        { type: "text", text: "Let me check." },
        { type: "tool-searchCatalog", toolCallId: "t1", state: "output-available", input: { query: "robotics" }, output: { rows: 2 } },
      ] },
    ] as UIMessage[];
    const out = await uiMessagesToAnthropic(messages, noopRun);
    expect(out[1]).toEqual({ role: "assistant", content: [
      { type: "text", text: "Let me check." },
      { type: "tool_use", id: "t1", name: "searchCatalog", input: { query: "robotics" } },
    ] });
    expect(out[2]).toEqual({ role: "user", content: [{ type: "tool_result", tool_use_id: "t1", content: JSON.stringify({ rows: 2 }) }] });
  });

  it("executes approved saves and returns the result to the model", async () => {
    const messages = [
      { id: "1", role: "user", parts: [{ type: "text", text: "save it" }] },
      { id: "2", role: "assistant", parts: [
        { type: "tool-saveCatalogOpportunity", toolCallId: "t1", state: "approval-responded", input: { opportunityId: "abc" }, approval: { id: "a1", approved: true } },
      ] },
      { id: "3", role: "user", parts: [{ type: "text", text: "done?" }] },
    ] as UIMessage[];
    const calls: unknown[] = [];
    const out = await uiMessagesToAnthropic(messages, async (name, input) => { calls.push([name, input]); return { saved: true }; });
    expect(calls).toEqual([["saveCatalogOpportunity", { opportunityId: "abc" }]]);
    expect(out[1].content).toEqual([{ type: "tool_use", id: "t1", name: "saveCatalogOpportunity", input: { opportunityId: "abc" } }]);
    expect(out[2].content).toEqual([{ type: "tool_result", tool_use_id: "t1", content: JSON.stringify({ saved: true }) }]);
  });

  it("tells the model when a save was declined, without executing it", async () => {
    const messages = [
      { id: "1", role: "user", parts: [{ type: "text", text: "no thanks" }] },
      { id: "2", role: "assistant", parts: [
        { type: "tool-saveResearchedOpportunity", toolCallId: "t9", state: "approval-responded", input: { name: "X" }, approval: { id: "a1", approved: false } },
      ] },
    ] as UIMessage[];
    let called = false;
    const out = await uiMessagesToAnthropic(messages, async () => { called = true; return {}; });
    expect(called).toBe(false);
    expect(out[2].content[0]).toMatchObject({ type: "tool_result", tool_use_id: "t9" });
    expect(String(out[2].content[0]["content"])).toContain("declined");
  });

  it("never lets an unanswered approval look like a completed save", async () => {
    const messages = [
      { id: "1", role: "user", parts: [{ type: "text", text: "save it" }] },
      { id: "2", role: "assistant", parts: [
        { type: "tool-saveCatalogOpportunity", toolCallId: "t1", state: "approval-requested", input: { opportunityId: "abc" }, approval: { id: "a1" } },
      ] },
      { id: "3", role: "user", parts: [{ type: "text", text: "actually, tell me more" }] },
    ] as UIMessage[];
    let called = false;
    const out = await uiMessagesToAnthropic(messages, async () => { called = true; return {}; });
    expect(called).toBe(false);
    expect(String(out[2].content[0]["content"])).toContain("has not responded");
  });

  it("replays provider web searches as plain-text notes, not fake server blocks", async () => {
    const messages = [
      { id: "1", role: "user", parts: [{ type: "text", text: "search online" }] },
      { id: "2", role: "assistant", parts: [
        { type: "tool-webSearch", toolCallId: "srv1", state: "output-available", input: { query: "env volunteer" }, output: { sources: [{ title: "A", url: "https://a.org" }] } },
        { type: "text", text: "Found one." },
      ] },
    ] as UIMessage[];
    const out = await uiMessagesToAnthropic(messages, noopRun);
    expect(out[1].content[0]).toEqual({ type: "text", text: '[Web search performed: "env volunteer" — 1 sources found]' });
    expect(out[1].content[1]).toEqual({ type: "text", text: "Found one." });
  });

  it("merges adjacent same-role messages to satisfy the alternating-role contract", async () => {
    const messages = [
      { id: "1", role: "user", parts: [{ type: "text", text: "one" }] },
      { id: "2", role: "user", parts: [{ type: "text", text: "two" }] },
    ] as UIMessage[];
    const out = await uiMessagesToAnthropic(messages, noopRun);
    expect(out).toHaveLength(1);
    expect(out[0].content).toHaveLength(2);
  });
});
