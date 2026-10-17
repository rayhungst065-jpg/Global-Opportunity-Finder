import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const assistantHistory = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from("assistant_conversations").select("*").eq("user_id", context.userId).order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
});
export const createAssistantChat = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from("assistant_conversations").insert({ user_id: context.userId }).select().single();
  if (error) throw new Error(error.message);
  const { error: archiveError } = await context.supabase.from("assistant_conversations").update({ archived: true }).eq("user_id", context.userId).neq("id", data.id).eq("archived", false);
  if (archiveError) throw new Error(archiveError.message);
  return data;
});
export const loadAssistantChat = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v)).handler(async ({ data, context }) => {
  const { data: chat, error: chatError } = await context.supabase.from("assistant_conversations").select("*").eq("id", data.id).eq("user_id", context.userId).single();
  if (chatError) throw new Error("This chat is unavailable.");
  const { data: messages, error } = await context.supabase.from("assistant_messages").select("message_id, role, parts").eq("conversation_id", chat.id).eq("user_id", context.userId).order("created_at");
  if (error) throw new Error(error.message);
  return { chat, messages };
});