import { createClient } from "@supabase/supabase-js";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from "ai";
import { z } from "zod";
import type { Database, Json } from "@/integrations/supabase/types";
import { ASSISTANT_POLICY, isSummaryRequest, permittedProfile } from "@/lib/assistant-policy";
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId, withLovableAiGatewayRunIdHeader } from "./run-id.ts";

export async function handleAssistant(request: Request) {
  const token = request.headers.get("Authorization");
  if (!token?.startsWith("Bearer ")) return new Response("Please sign in to use the assistant.", { status: 401 });
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const url = process.env["SUPABASE_URL"];
  const aiKey = process.env["LOVABLE_API_KEY"];
  if (!key || !url || !aiKey) return new Response("The assistant's AI connection is not configured.", { status: 503 });
  const db = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: token } } });
  const { data: auth, error: authError } = await db.auth.getUser(token.slice(7));
  if (authError || !auth.user) return new Response("Your session expired. Please sign in again.", { status: 401 });
  const userId = auth.user.id;
  try {
    const body = z.object({ conversationId: z.string().uuid(), messages: z.array(z.object({ id: z.string(), role: z.enum(["user", "assistant"]), parts: z.array(z.record(z.unknown())) })) }).parse(await request.json());
    const { data: chat, error: chatError } = await db.from("assistant_conversations").select("id").eq("id", body.conversationId).eq("user_id", userId).single();
    if (chatError || !chat) return new Response("This conversation is unavailable.", { status: 403 });
    const { data: block, error: blockError } = await db.from("assistant_access_state").select("*").eq("user_id", userId).maybeSingle();
    if (blockError) throw new Error(blockError.message);
    if (block) return new Response(block.blocked_message, { status: block.status });
    const latest = body.messages.at(-1);
    const latestUser = [...body.messages].reverse().find(m => m.role === "user");
    if (!latest || !latestUser) return new Response("Enter a message.", { status: 400 });
    const text = latestUser.parts.filter(p => p["type"] === "text").map(p => String(p["text"] ?? "")).join("\n");
    const { error: writeError } = await db.from("assistant_messages").upsert({ conversation_id: chat.id, user_id: userId, message_id: latestUser.id, role: "user", parts: latestUser.parts as Json }, { onConflict: "conversation_id,message_id" });
    if (writeError) throw new Error(writeError.message);
    const { data: stored, error: historyError } = await db.from("assistant_messages").select("message_id, role, parts").eq("conversation_id", chat.id).eq("user_id", userId).order("created_at");
    if (historyError) throw new Error(historyError.message);
    // History comes from owner-scoped storage, not a client-supplied transcript.
    const messages = (stored ?? []).map(m => ({ id: m.message_id, role: m.role, parts: m.parts })) as UIMessage[];
    // Approval responses are tied to the persisted tool invocation, never arbitrary tool results.
    for (const incoming of body.messages) {
      const existing = messages.find(m => m.id === incoming.id && m.role === "assistant");
      if (!existing) continue;
      let approvalChanged = false;
      for (const part of existing.parts) {
        if (!part.type.startsWith("tool-") || !("state" in part) || part.state !== "approval-requested" || !("approval" in part) || !part.approval) continue;
        const approved = incoming.parts.find(p => p["type"] === part.type && p["toolCallId"] === ("toolCallId" in part ? part.toolCallId : undefined) && p["state"] === "approval-responded");
        const approval = approved?.["approval"];
        if (approval && typeof approval === "object" && "id" in approval && approval.id === part.approval.id && "approved" in approval && typeof approval.approved === "boolean") {
          Object.assign(part, { state: "approval-responded", approval: { id: part.approval.id, approved: approval.approved } });
          approvalChanged = true;
        }
      }
      if (approvalChanged) {
        const { error } = await db.from("assistant_messages").update({ parts: existing.parts as Json }).eq("conversation_id", chat.id).eq("user_id", userId).eq("message_id", existing.id);
        if (error) throw new Error(error.message);
      }
    }
    const { data: profile, error: profileError } = await db.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (profileError) throw new Error(profileError.message);
    const run = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
    const provider = createOpenAI({ baseURL: "https://ai.gateway.lovable.dev/v1", apiKey: aiKey, headers: { "Lovable-API-Key": aiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" }, fetch: async (input, init) => {
      const response = await run.fetch(input, init);
      if ([402, 403].includes(response.status)) {
        const raw = await response.clone().text();
        let safe = "AI access is paused. The project owner must review AI billing or access settings.";
        try { const parsed = JSON.parse(raw); safe = parsed.message ?? parsed.error?.message ?? safe; } catch { /* keep safe fallback */ }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("assistant_access_state").upsert({ user_id: userId, status: response.status, blocked_message: safe });
        if (error) console.error("Unable to save assistant pause state", error.message);
      }
      return response;
    } });
    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"), instructions: `${ASSISTANT_POLICY}\nToday's UTC date: ${new Date().toISOString().slice(0, 10)}\nPermitted profile: ${JSON.stringify(permittedProfile(profile))}`,
      messages: await convertToModelMessages(messages), abortSignal: request.signal, maxRetries: 0,
      providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } },
      stopWhen: stepCountIs(50),
      tools: {
        searchCatalog: tool({ description: "Read shared opportunity records. Demo records are not actual opportunities. Returns eligibility, deadline and official link if recorded.", inputSchema: z.object({ query: z.string() }), execute: async ({ query }) => {
          const { data: rows, error } = await db.from("opportunities").select("*");
          if (error) throw new Error(error.message);
          const words = query.toLowerCase().split(/\s+/).filter(Boolean);
          return (rows ?? []).filter(r => words.some(w => `${r.title} ${r.description} ${r.category} ${r.eligibility}`.toLowerCase().includes(w))).map(r => ({ ...r, verification: r.is_demo ? "DEMO — not real" : "Catalog record; details require official confirmation" }));
        } }),
        liveSearch: tool({ description: "Check whether live internet opportunity search is available.", inputSchema: z.object({ query: z.string() }), execute: async () => ({ available: false, reason: "The project owner skipped the Parallel search connection. No live internet search has run. Ask for an official opportunity link or use the catalog without claiming current verification." }) }),
        saveCatalogOpportunity: tool({ description: "Save an existing shared catalog opportunity to this student's dashboard. Requires student approval. Never inserts or edits shared opportunity records.", inputSchema: z.object({ opportunityId: z.string() }), needsApproval: true, execute: async ({ opportunityId }) => {
          const id = z.string().uuid().parse(opportunityId);
          const { data: row, error: rowError } = await db.from("opportunities").select("id, title, is_demo, deadline").eq("id", id).single();
          if (rowError) throw new Error("Opportunity not found.");
          const { error } = await db.from("saved_opportunities").upsert({ user_id: userId, opportunity_id: id }, { onConflict: "user_id,opportunity_id", ignoreDuplicates: true });
          if (error) throw new Error(error.message);
          return { saved: true, ...row, reminder: "Saved deadlines appear on the dashboard; automatic reminders are not implemented." };
        } }),
      },
    });
    return withLovableAiGatewayRunIdHeader(result.toUIMessageStreamResponse({ originalMessages: messages, sendReasoning: true, onError: error => error instanceof Error ? error.message : "The AI request failed. Please try again when access is available.", onFinish: async ({ responseMessage, isAborted }) => {
      if (isAborted) return;
      const { error } = await db.from("assistant_messages").upsert({ conversation_id: chat.id, user_id: userId, message_id: responseMessage.id, role: "assistant", parts: responseMessage.parts as Json }, { onConflict: "conversation_id,message_id" });
      if (error) throw new Error(`Could not save the assistant response: ${error.message}`);
      const summary = responseMessage.parts.filter(p => p.type === "text").map(p => p.text).join("\n");
      const { error: updateError } = await db.from("assistant_conversations").update({ updated_at: new Date().toISOString(), ...(messages.length < 2 ? { title: text.slice(0, 70) } : {}), ...(isSummaryRequest(text) && summary ? { summary } : {}) }).eq("id", chat.id).eq("user_id", userId);
      if (updateError) throw new Error(updateError.message);
    } }), run);
  } catch (error) {
    if (request.signal.aborted) return new Response("Stopped", { status: 499 });
    return new Response(error instanceof Error ? error.message : "The assistant could not complete this request.", { status: error instanceof z.ZodError ? 400 : 500 });
  }
}