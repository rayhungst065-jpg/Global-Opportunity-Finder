import { describe, it, expect, vi } from "vitest";
const { db, userId } = vi.hoisted(() => ({ db: { from: vi.fn() }, userId: "11111111-1111-4111-8111-111111111111" }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => {
  const builder = { middleware: () => builder, inputValidator: (validator: (v: unknown) => unknown) => ({ handler: (handler: (v: unknown) => unknown) => (input: { data: unknown }) => handler({ data: validator(input.data), context: { userId, supabase: db } }) }), handler: (handler: (v: unknown) => unknown) => () => handler({ context: { userId, supabase: db } }) };
  return builder;
} }));
import { saveChatRecommendation, removeChatRecommendation } from "@/lib/chat-recommendations.functions";
const recommendation = { name: "Original opportunity", description: "Original description", deadline: null, officialUrl: null, reason: "Original Gemini reason", catalogId: null };
const storedRecommendation = { ...recommendation, category: "awards", organizer: null, deadlineEstimate: null };
describe("original chat recommendation saves", () => {
  it("saves the stored original recommendation and ignores caller-supplied replacements", async () => {
    const messageQuery = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: "22222222-2222-4222-8222-222222222222", parts: [{ type: "tool-recommendOpportunity", state: "output-available", toolCallId: "call-1", output: recommendation }] }, error: null }) };
    const upsert = vi.fn().mockResolvedValue({ error: null });
    db.from.mockImplementation(table => table === "assistant_messages" ? messageQuery : { upsert });
    await saveChatRecommendation({ data: { conversationId: "33333333-3333-4333-8333-333333333333", messageId: "message-1", toolCallId: "call-1", recommendation: { reason: "Changed" }, userId: "other" } } as Parameters<typeof saveChatRecommendation>[0]);
    expect(upsert).toHaveBeenCalledWith({ user_id: userId, assistant_message_id: "22222222-2222-4222-8222-222222222222", tool_call_id: "call-1", recommendation }, { onConflict: "user_id,assistant_message_id,tool_call_id", ignoreDuplicates: true });
    expect(messageQuery.eq).toHaveBeenCalledWith("user_id", userId);
  });
  it("rejects recommendations absent from the owner's stored assistant message", async () => {
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: { message: "not found" } }) };
    db.from.mockReturnValue(query);
    await expect(saveChatRecommendation({ data: { conversationId: "33333333-3333-4333-8333-333333333333", messageId: "missing", toolCallId: "call-1" } })).rejects.toThrow("has not finished saving");
  });
  it("removes only a saved recommendation owned by the caller", async () => {
    const query = { delete: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), then: (resolve: (v: unknown) => unknown) => resolve({ error: null }) };
    db.from.mockReturnValue(query);
    await removeChatRecommendation({ data: { id: "22222222-2222-4222-8222-222222222222" } });
    expect(db.from).toHaveBeenCalledWith("saved_chat_recommendations");
    expect(query.eq).toHaveBeenCalledWith("user_id", userId);
  });
});