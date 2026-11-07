import type { UIMessage } from "ai";
import type { MessagesRequest } from "@lovable.dev/ai-gateway";

type BetaMessage = MessagesRequest["messages"][number];
export type AnthropicContentBlock = Extract<BetaMessage["content"], unknown[]>[number];
export type AnthropicMessage = { role: "user" | "assistant"; content: AnthropicContentBlock[] };

/** Tools that change student data and therefore require explicit approval before running. */
export const APPROVAL_TOOLS = new Set(["saveCatalogOpportunity", "saveResearchedOpportunity"]);

type ToolPart = {
  type: string;
  toolCallId?: string;
  state?: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
  approval?: { id: string; approved?: boolean };
};

/**
 * Convert persisted UI messages into Anthropic Messages API parameters.
 * Approval responses are resolved here: an approved save executes now (server-side,
 * with the student's own RLS client) and becomes a tool result; declined or
 * unanswered approvals become explanatory tool results so the model never
 * assumes a save happened.
 */
export async function uiMessagesToAnthropic(
  messages: UIMessage[],
  runApprovedTool: (toolName: string, input: unknown) => Promise<unknown>,
): Promise<AnthropicMessage[]> {
  const out: AnthropicMessage[] = [];
  for (const message of messages) {
    if (message.role === "user") {
      const text = message.parts
        .filter((p) => p.type === "text")
        .map((p) => String((p as { text?: unknown }).text ?? ""))
        .join("\n")
        .trim();
      if (text) out.push({ role: "user", content: [{ type: "text", text }] });
      continue;
    }
    const blocks: AnthropicContentBlock[] = [];
    const toolResults: AnthropicContentBlock[] = [];
    for (const part of message.parts) {
      if (part.type === "text") {
        const text = String((part as { text?: unknown }).text ?? "").trim();
        if (text) blocks.push({ type: "text", text });
        continue;
      }
      if (part.type === "reasoning" || part.type.startsWith("data-") || part.type.startsWith("source-")) continue;
      if (!part.type.startsWith("tool-")) continue;
      const tool = part as unknown as ToolPart;
      if (!tool.toolCallId) continue;
      const name = tool.type.slice("tool-".length);
      if (name === "webSearch") {
        // Provider-executed search blocks cannot be replayed faithfully; keep a plain-text note.
        const query = (tool.input as { query?: unknown } | undefined)?.query;
        const sources = (tool.output as { sources?: unknown } | undefined)?.sources;
        const count = Array.isArray(sources) ? sources.length : 0;
        blocks.push({ type: "text", text: `[Web search performed${typeof query === "string" && query ? `: "${query}"` : ""}${count ? ` — ${count} sources found` : ""}]` });
        continue;
      }
      const toolInput: Record<string, unknown> = tool.input && typeof tool.input === "object" && !Array.isArray(tool.input) ? tool.input as Record<string, unknown> : {};
      blocks.push({ type: "tool_use", id: tool.toolCallId, name, input: toolInput });
      if (tool.state === "output-available") {
        toolResults.push({ type: "tool_result", tool_use_id: tool.toolCallId, content: JSON.stringify(tool.output ?? null) });
      } else if (tool.state === "output-error") {
        toolResults.push({ type: "tool_result", tool_use_id: tool.toolCallId, content: tool.errorText ?? "The tool failed.", is_error: true });
      } else if (tool.state === "approval-responded" && tool.approval) {
        if (tool.approval.approved) {
          try {
            const output = await runApprovedTool(name, tool.input);
            toolResults.push({ type: "tool_result", tool_use_id: tool.toolCallId, content: JSON.stringify(output ?? null) });
          } catch (error) {
            toolResults.push({ type: "tool_result", tool_use_id: tool.toolCallId, content: error instanceof Error ? error.message : "The save failed.", is_error: true });
          }
        } else {
          toolResults.push({ type: "tool_result", tool_use_id: tool.toolCallId, content: "The student declined this action. Do not repeat it unless they ask again." });
        }
      } else {
        toolResults.push({ type: "tool_result", tool_use_id: tool.toolCallId, content: "The student has not responded to this approval request. Do not assume the action happened." });
      }
    }
    if (blocks.length) out.push({ role: "assistant", content: blocks });
    if (toolResults.length) out.push({ role: "user", content: toolResults });
  }
  // The Messages API requires alternating roles; merge adjacent same-role messages.
  const merged: AnthropicMessage[] = [];
  for (const m of out) {
    const last = merged.at(-1);
    if (last && last.role === m.role) last.content.push(...m.content);
    else merged.push({ role: m.role, content: [...m.content] });
  }
  return merged;
}
