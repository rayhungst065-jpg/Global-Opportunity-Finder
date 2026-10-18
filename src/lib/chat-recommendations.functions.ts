import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { chatRecommendationSchema } from "@/lib/chat-recommendation";
import type { Json } from "@/integrations/supabase/types";

export const savedChatRecommendations = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from("saved_chat_recommendations").select("*").eq("user_id", context.userId).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
});

export const saveChatRecommendation = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ conversationId: z.string().uuid(), messageId: z.string(), toolCallId: z.string() }).parse(v))
  .handler(async ({ context, data }) => {
    const { data: message, error } = await context.supabase.from("assistant_messages").select("id, parts").eq("user_id", context.userId).eq("conversation_id", data.conversationId).eq("message_id", data.messageId).eq("role", "assistant").single();
    if (error || !message) throw new Error("This recommendation has not finished saving in your chat. Please try again after the reply finishes.");
    const parts = z.array(z.record(z.unknown())).parse(message.parts);
    const part = parts.find(p => p["type"] === "tool-recommendOpportunity" && p["toolCallId"] === data.toolCallId && p["state"] === "output-available");
    const recommendation = chatRecommendationSchema.parse(part?.["output"]);
    const { error: writeError } = await context.supabase.from("saved_chat_recommendations").upsert({ user_id: context.userId, assistant_message_id: message.id, tool_call_id: data.toolCallId, recommendation: recommendation as Json }, { onConflict: "user_id,assistant_message_id,tool_call_id", ignoreDuplicates: true });
    if (writeError) throw new Error(writeError.message);
    return { saved: true };
  });

export const removeChatRecommendation = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("saved_chat_recommendations").delete().eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { removed: true };
  });