import { createClient } from "@supabase/supabase-js";
import { streamMessage, GatewayError, type EventFor, type MessagesRequest } from "@lovable.dev/ai-gateway";
import { createUIMessageStream, createUIMessageStreamResponse, generateId, type UIMessage } from "ai";
import { z } from "zod";
import type { Database, Json } from "@/integrations/supabase/types";
import { ASSISTANT_POLICY, isSummaryRequest, permittedProfile } from "@/lib/assistant-policy";
import { isNormalRecommendation, safeOfficialUrl, verificationState } from "@/lib/opportunity-source";
import { chatRecommendationSchema, normalizeChatRecommendation } from "@/lib/chat-recommendation";
import { catalogCategoryKeys } from "@/lib/opportunity-catalog";
import { ASSISTANT_MODEL, budgetExceeded, creditsForUsage, monthKeyUtc, type AssistantUsage } from "@/lib/ai/assistant-budget";
import { APPROVAL_TOOLS, uiMessagesToAnthropic, type AnthropicContentBlock, type AnthropicMessage } from "@/lib/ai/messages-adapter";

/** Typed stream events for the selected model; the SDK returns the stream payload as unknown. */
type AssistantStreamEvent = EventFor<"messages", typeof ASSISTANT_MODEL>;

const BUDGET_MESSAGE ="The website's shared monthly AI budget ($10.00) has been reached. AI opportunity search pauses until the monthly reset on the first day of next month (UTC).";

const researchedOpportunitySchema = z.object({
  name: z.string().trim().min(1).max(250),
  description: z.string().trim().min(1).max(2000),
  category: z.enum(catalogCategoryKeys),
  organizer: z.string().trim().min(1).max(250),
  eligibility: z.string().trim().max(500).default(""),
  location: z.string().trim().max(250).default(""),
  deadlineEstimate: z.string().trim().min(1).max(120).nullable().default(null),
  officialUrl: z.string().nullable(),
});

/** Anthropic Messages API tool declarations, including the provider-run web search. */
const TOOLS: NonNullable<MessagesRequest["tools"]> = [
  { type: "web_search_20250305", name: "web_search", max_uses: 3 },
  {
    name: "searchCatalog",
    description: "Read shared opportunity records. Demo records are not actual opportunities. Returns eligibility, deadline and official link if recorded.",
    input_schema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
  },
  {
    name: "recommendOpportunity",
    description:
      "Present one original, specific opportunity recommendation as a chat card with a Save option. Opportunities already in Explore Opportunities are linked by title; new ones are shown in chat only and never added to the shared catalog. Prefer an existing catalogId and accurate catalog facts; use null for unknown dates/links, and deadlineEstimate for a labeled approximate period such as 'mid-July'. Only recommend specific identifiable opportunities, never general advice. Preserve your personalized reason.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        category: { type: "string", enum: [...catalogCategoryKeys] },
        organizer: { type: ["string", "null"] },
        deadline: { type: ["string", "null"] },
        deadlineEstimate: { type: ["string", "null"] },
        officialUrl: { type: ["string", "null"] },
        reason: { type: "string" },
        catalogId: { type: ["string", "null"] },
      },
      required: ["name", "description", "category", "reason", "catalogId"],
    },
  },
  {
    name: "saveCatalogOpportunity",
    description: "Save an existing shared catalog opportunity to this student's dashboard. Requires student approval. Never inserts or edits shared opportunity records.",
    input_schema: { type: "object", properties: { opportunityId: { type: "string" } }, required: ["opportunityId"] },
  },
  {
    name: "saveResearchedOpportunity",
    description:
      "Save an opportunity found through web research to this student's private Explore Opportunities list. Requires student approval. Creates a private record visible only to this student; never adds to the shared public catalog. Duplicate titles are reused instead of duplicated.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        category: { type: "string", enum: [...catalogCategoryKeys] },
        organizer: { type: "string" },
        eligibility: { type: "string" },
        location: { type: "string" },
        deadlineEstimate: { type: ["string", "null"] },
        officialUrl: { type: ["string", "null"] },
      },
      required: ["name", "description", "category", "organizer"],
    },
  },
];

/** Remove provider citation markup (<cite ...>...</cite>) that can leak into tool inputs. */
function stripCitations(value: string): string {
  return value.replace(/<cite[^>]*>/g, "").replace(/<\/cite>/g, "").replace(/\s{2,}/g, " ").trim();
}

function parseToolInput(json: string): Record<string, unknown> {
  if (!json.trim()) return {};
  try {
    const value: unknown = JSON.parse(json);
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

export async function handleAssistant(request: Request) {
  const token = request.headers.get("Authorization");
  if (!token?.startsWith("Bearer ")) return new Response("Please sign in to use the assistant.", { status: 401 });
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const url = process.env["SUPABASE_URL"];
  if (!key || !url) return new Response("The assistant's AI connection is not configured.", { status: 503 });
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
    // Provider-tagged denials persist; denials from a previous provider must not block this one.
    if (block?.blocked_message.startsWith("Lovable AI:")) return new Response(block.blocked_message, { status: block.status ?? 403 });
    // Shared monthly budget guard: one global counter across all students.
    const month = monthKeyUtc();
    const { data: usageRow, error: usageError } = await db.from("assistant_usage_months").select("credits_used").eq("month", month).maybeSingle();
    if (usageError) throw new Error(usageError.message);
    if (budgetExceeded(Number(usageRow?.credits_used ?? 0))) return new Response(BUDGET_MESSAGE, { status: 429 });
    const latest = body.messages.at(-1);
    const latestUser = [...body.messages].reverse().find(m => m.role === "user");
    if (!latest || !latestUser) return new Response("Enter a message.", { status: 400 });
    const text = latestUser.parts.filter(p => p["type"] === "text").map(p => String(p["text"] ?? "")).join("\n");
    const { error: writeError } = await db.from("assistant_messages").upsert({ conversation_id: chat.id, user_id: userId, message_id: latestUser.id, role: "user", parts: latestUser.parts as Json }, { onConflict: "conversation_id,message_id", ignoreDuplicates: true });
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

    /** Persist terminal provider denials so reloads do not retry them. */
    async function recordAccessDenial(cause: unknown) {
      if (!(cause instanceof GatewayError) || ![401, 402, 403].includes(cause.httpStatus ?? 0)) return;
      const safe = `Lovable AI: access denied (HTTP ${cause.httpStatus}). The built-in AI connection needs attention; no student action is required.`;
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.from("assistant_access_state").upsert({ user_id: userId, status: cause.httpStatus ?? 403, blocked_message: safe });
      if (error) console.error("Unable to save assistant pause state", error.message);
    }

    /** Execute one assistant tool with the student's own RLS client. */
    async function executeTool(name: string, input: unknown): Promise<unknown> {
      if (name === "searchCatalog") {
        const { query } = z.object({ query: z.string() }).parse(input);
        const { data: rows, error } = await db.from("opportunities").select("*");
        if (error) throw new Error(error.message);
        const words = query.toLowerCase().split(/\s+/).filter(Boolean);
        return (rows ?? []).filter(r => isNormalRecommendation(r) && words.some(w => `${r.title} ${r.description} ${r.category} ${r.eligibility}`.toLowerCase().includes(w))).slice(0, 8).map(r => ({ ...r, verification: verificationState(r.last_verified_at, r.deadline) }));
      }
      if (name === "recommendOpportunity") {
        const raw = chatRecommendationSchema.parse(input);
        const recommendation = { ...raw, name: stripCitations(raw.name), description: stripCitations(raw.description), reason: stripCitations(raw.reason), organizer: raw.organizer ? stripCitations(raw.organizer) : raw.organizer };
        if (recommendation.catalogId) {
          const { data: row, error } = await db.from("opportunities").select("*").eq("id", recommendation.catalogId).single();
          if (error || !row || !isNormalRecommendation(row)) throw new Error("This catalog opportunity is unavailable for recommendation.");
          return normalizeChatRecommendation({ ...recommendation, name: row.title, description: row.description, deadline: row.deadline, deadlineEstimate: row.deadline_estimate, officialUrl: row.official_url });
        }
        // Not in the catalog: show the card only. Shared catalog writes are admin-only, so chat never inserts rows.
        const normalized = recommendation.name.trim().replace(/\s+/g, " ").toLowerCase();
        const { data: existing, error: findError } = await db.from("opportunities").select("*").ilike("title", normalized).limit(5);
        if (findError) throw new Error(findError.message);
        const match = (existing ?? []).find(r => r.title.trim().replace(/\s+/g, " ").toLowerCase() === normalized);
        if (match) return normalizeChatRecommendation({ ...recommendation, catalogId: match.id, name: match.title, description: match.description, deadline: match.deadline, deadlineEstimate: match.deadline_estimate, officialUrl: match.official_url });
        return normalizeChatRecommendation({ ...recommendation, catalogId: null, officialUrl: safeOfficialUrl(recommendation.officialUrl) });
      }
      if (name === "saveCatalogOpportunity") {
        const { opportunityId } = z.object({ opportunityId: z.string() }).parse(input);
        const id = z.string().uuid().parse(opportunityId);
        const { data: row, error: rowError } = await db.from("opportunities").select("id, title, is_demo, deadline").eq("id", id).single();
        if (rowError) throw new Error("Opportunity not found.");
        const { error } = await db.from("saved_opportunities").upsert({ user_id: userId, opportunity_id: id }, { onConflict: "user_id,opportunity_id", ignoreDuplicates: true });
        if (error) throw new Error(error.message);
        return { saved: true, ...row, reminder: "Saved deadlines appear on the dashboard; automatic reminders are not implemented." };
      }
      if (name === "saveResearchedOpportunity") {
        const raw = researchedOpportunitySchema.parse(input);
        const parsed = { ...raw, name: stripCitations(raw.name), description: stripCitations(raw.description), organizer: stripCitations(raw.organizer), eligibility: stripCitations(raw.eligibility), location: stripCitations(raw.location) };
        const normalized = parsed.name.trim().replace(/\s+/g, " ").toLowerCase();
        // Duplicate handling: reuse a shared catalog record or this student's own private record.
        const { data: candidates, error: findError } = await db.from("opportunities").select("id, title, owner_user_id, is_demo, deadline").ilike("title", normalized).limit(10);
        if (findError) throw new Error(findError.message);
        const match = (candidates ?? []).find(r => r.title.trim().replace(/\s+/g, " ").toLowerCase() === normalized);
        let id = match?.id;
        if (!id) {
          const { data: inserted, error: insertError } = await db.from("opportunities").insert({
            owner_user_id: userId,
            title: parsed.name.trim(),
            description: parsed.description,
            category: parsed.category,
            organizer: parsed.organizer,
            eligibility: parsed.eligibility,
            location: parsed.location,
            deadline: null,
            deadline_estimate: parsed.deadlineEstimate,
            official_url: safeOfficialUrl(parsed.officialUrl),
            is_demo: false,
            source_record: { origin: "assistant_research", note: "Found through the student's private AI web research; not independently verified." },
          }).select("id").single();
          if (insertError) throw new Error(insertError.message);
          id = inserted.id;
        }
        const { error: saveError } = await db.from("saved_opportunities").upsert({ user_id: userId, opportunity_id: id }, { onConflict: "user_id,opportunity_id", ignoreDuplicates: true });
        if (saveError) throw new Error(saveError.message);
        return { saved: true, id, title: parsed.name.trim(), duplicate: Boolean(match), private: true, reminder: "Saved to your private Explore Opportunities list; the shared catalog is unchanged." };
      }
      throw new Error(`Unknown tool: ${name}`);
    }

    const anthropicMessages = await uiMessagesToAnthropic(messages, executeTool);
    const usage: AssistantUsage = { inputTokens: 0, outputTokens: 0, webSearchRequests: 0 };

    const stream = createUIMessageStream({
      originalMessages: messages,
      generateId,
      onError: error => error instanceof GatewayError
        ? "The AI service could not complete this request. Please try again later."
        : error instanceof Error ? error.message : "The AI request failed. Please try again when access is available.",
      execute: async ({ writer }) => {
        let conversation: AnthropicMessage[] = anthropicMessages;
        for (let step = 0; step < 5; step++) {
          let gwStream;
          try {
            gwStream = await streamMessage({
              model: ASSISTANT_MODEL,
              system: `${ASSISTANT_POLICY}\nToday's UTC date: ${new Date().toISOString().slice(0, 10)}\nPermitted profile: ${JSON.stringify(permittedProfile(profile))}`,
              messages: conversation,
              max_tokens: 8192,
              tools: TOOLS,
            }, { signal: request.signal });
          } catch (error) {
            await recordAccessDenial(error);
            throw error;
          }
          const blocks: AnthropicContentBlock[] = [];
          const toolResults: AnthropicContentBlock[] = [];
          const searchQueries = new Map<string, string>();
          let textId: string | null = null;
          let activeTool: { id: string; name: string; json: string } | null = null;
          let stopReason: string | null = null;
          let approvalPending = false;
          let stepOutput = 0;
          let stepSearches = 0;
          try {
            for await (const event of gwStream as AsyncIterable<AssistantStreamEvent>) {
              if (event.type === "message_start") {
                const u = event.message.usage;
                usage.inputTokens += (u.input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0);
              } else if (event.type === "content_block_start") {
                const block = event.content_block;
                if (block.type === "text") {
                  textId = generateId();
                  writer.write({ type: "text-start", id: textId });
                  blocks.push({ type: "text", text: "" });
                } else if (block.type === "tool_use") {
                  activeTool = { id: block.id, name: block.name, json: "" };
                } else if (block.type === "server_tool_use") {
                  blocks.push(block as unknown as AnthropicContentBlock);
                  if (block.name === "web_search") searchQueries.set(block.id, String((block.input as { query?: unknown })?.query ?? ""));
                } else if (block.type === "web_search_tool_result") {
                  blocks.push(block as unknown as AnthropicContentBlock);
                  const content = (block as { content?: unknown }).content;
                  const sources = Array.isArray(content)
                    ? content.filter(r => (r as { type?: unknown }).type === "web_search_result").map(r => ({ title: String((r as { title?: unknown }).title ?? ""), url: String((r as { url?: unknown }).url ?? "") }))
                    : [];
                  const callId = String((block as { tool_use_id?: unknown }).tool_use_id ?? "");
                  writer.write({ type: "tool-input-available", toolCallId: callId, toolName: "webSearch", input: { query: searchQueries.get(callId) ?? "" }, providerExecuted: true });
                  writer.write({ type: "tool-output-available", toolCallId: callId, output: { sources }, providerExecuted: true });
                }
              } else if (event.type === "content_block_delta") {
                const delta = event.delta;
                if (delta.type === "text_delta" && textId) {
                  writer.write({ type: "text-delta", id: textId, delta: delta.text });
                  const last = blocks.at(-1);
                  if (last && last["type"] === "text") last["text"] = String(last["text"] ?? "") + delta.text;
                } else if (delta.type === "input_json_delta" && activeTool) {
                  activeTool.json += delta.partial_json;
                }
              } else if (event.type === "content_block_stop") {
                if (textId) { writer.write({ type: "text-end", id: textId }); textId = null; }
                if (activeTool) {
                  const input = parseToolInput(activeTool.json);
                  blocks.push({ type: "tool_use", id: activeTool.id, name: activeTool.name, input });
                  writer.write({ type: "tool-input-available", toolCallId: activeTool.id, toolName: activeTool.name, input });
                  if (APPROVAL_TOOLS.has(activeTool.name)) {
                    writer.write({ type: "tool-approval-request", approvalId: generateId(), toolCallId: activeTool.id });
                    approvalPending = true;
                  } else {
                    try {
                      const output = await executeTool(activeTool.name, input);
                      writer.write({ type: "tool-output-available", toolCallId: activeTool.id, output });
                      toolResults.push({ type: "tool_result", tool_use_id: activeTool.id, content: JSON.stringify(output ?? null) });
                    } catch (error) {
                      const message = error instanceof Error ? error.message : "The tool failed.";
                      writer.write({ type: "tool-output-error", toolCallId: activeTool.id, errorText: message });
                      toolResults.push({ type: "tool_result", tool_use_id: activeTool.id, content: message, is_error: true });
                    }
                  }
                  activeTool = null;
                }
              } else if (event.type === "message_delta") {
                stopReason = event.delta.stop_reason ?? stopReason;
                stepOutput = Math.max(stepOutput, event.usage?.output_tokens ?? 0);
                stepSearches = Math.max(stepSearches, event.usage?.server_tool_use?.web_search_requests ?? 0);
              }
            }
          } catch (error) {
            await recordAccessDenial(error);
            throw error;
          }
          usage.outputTokens += stepOutput;
          usage.webSearchRequests += stepSearches;
          conversation = [...conversation, { role: "assistant", content: blocks }];
          if (stopReason === "tool_use" && !approvalPending && toolResults.length) {
            conversation = [...conversation, { role: "user", content: toolResults }];
            continue;
          }
          break;
        }
      },
      onEnd: async ({ responseMessage, isAborted, isCancelled }) => {
        // Record real token/search spend against the shared monthly budget, even on cancel.
        const credits = creditsForUsage(usage);
        if (credits > 0) {
          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const { error } = await supabaseAdmin.rpc("record_assistant_usage", { p_month: month, p_credits: credits });
            if (error) console.error("Unable to record assistant usage", error.message);
          } catch (error) {
            console.error("Unable to record assistant usage", error instanceof Error ? error.message : error);
          }
        }
        if (isAborted || isCancelled) return;
        const { data: existingResponse } = await db.from("assistant_messages").select("id").eq("conversation_id", chat.id).eq("user_id", userId).eq("message_id", responseMessage.id).maybeSingle();
        const { error } = existingResponse
          ? await db.from("assistant_messages").update({ parts: responseMessage.parts as Json }).eq("id", existingResponse.id).eq("user_id", userId)
          : await db.from("assistant_messages").insert({ conversation_id: chat.id, user_id: userId, message_id: responseMessage.id, role: "assistant", parts: responseMessage.parts as Json });
        if (error) throw new Error(`Could not save the assistant response: ${error.message}`);
        const summary = responseMessage.parts.filter(p => p.type === "text").map(p => p.text).join("\n");
        const { error: updateError } = await db.from("assistant_conversations").update({ updated_at: new Date().toISOString(), ...(messages.length < 2 ? { title: text.slice(0, 70) } : {}), ...(isSummaryRequest(text) && summary ? { summary } : {}) }).eq("id", chat.id).eq("user_id", userId);
        if (updateError) throw new Error(updateError.message);
      },
    });
    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    if (request.signal.aborted) return new Response("Stopped", { status: 499 });
    return new Response(error instanceof Error ? error.message : "The assistant could not complete this request.", { status: error instanceof z.ZodError ? 400 : 500 });
  }
}
