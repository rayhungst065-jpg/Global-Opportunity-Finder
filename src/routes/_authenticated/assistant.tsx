import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses, type UIMessage, type ToolUIPart } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, History, FileText, Bookmark, ShieldCheck } from "lucide-react";
import { WorkspaceShell } from "@/components/site/WorkspaceShell";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from "@/components/ai-elements/prompt-input";
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import { Reasoning, ReasoningTrigger, ReasoningContent } from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { assistantHistory, createAssistantChat, loadAssistantChat } from "@/lib/assistant.functions";
import { SUMMARY_REQUEST } from "@/lib/assistant-policy";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/auth";
import type { Json } from "@/integrations/supabase/types";
import symbol from "@/assets/logo-symbol.png.asset.json";

export const Route = createFileRoute("/_authenticated/assistant")({ head: () => ({ meta: [
  { title: "AI Opportunity Assistant — Global Opportunity Finder" },
  { name: "description", content: "Your private opportunity conversations, personalized application plans and summaries." },
  { property: "og:title", content: "AI Opportunity Assistant — Global Opportunity Finder" },
  { property: "og:description", content: "Plan your next student opportunity with a private AI assistant." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
] }), component: AssistantPage });

function AssistantPage() {
  const historyFn = useServerFn(assistantHistory);
  const createFn = useServerFn(createAssistantChat);
  const loadFn = useServerFn(loadAssistantChat);
  const qc = useQueryClient();
  const { user } = useUser();
  const [selected, setSelected] = useState<string>();
  const [notice, setNotice] = useState("");
  const [creating, setCreating] = useState(false);
  const history = useQuery({ queryKey: ["assistant-history", user?.id], queryFn: () => historyFn() });
  const activeId = selected ?? history.data?.find(c => !c.archived)?.id ?? history.data?.[0]?.id;
  const chat = useQuery({ queryKey: ["assistant-chat", user?.id, activeId], enabled: !!activeId, queryFn: () => { if (!activeId) throw new Error("No chat selected"); return loadFn({ data: { id: activeId } }); } });
  async function startNew() {
    setCreating(true); setNotice("");
    try { const c = await createFn(); setSelected(c.id); await qc.invalidateQueries({ queryKey: ["assistant-history"] }); }
    catch (e) { setNotice(e instanceof Error ? e.message : "Could not start a chat."); }
    finally { setCreating(false); }
  }
  return <WorkspaceShell title="AI Opportunity Assistant">
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <Button variant="outline" onClick={startNew} disabled={creating}><Plus />Start New Chat</Button>
      <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost"><History />Previous chats</Button></DropdownMenuTrigger><DropdownMenuContent className="max-h-80 w-72 overflow-y-auto">{history.data?.map(c => <DropdownMenuItem key={c.id} onClick={() => setSelected(c.id)} className="whitespace-normal">{c.title}</DropdownMenuItem>)}{!history.data?.length && <p className="p-3 text-sm text-muted-foreground">No previous chats.</p>}</DropdownMenuContent></DropdownMenu>
    </div>
    <p className="mb-4 flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0" />Chat messages and selected profile preferences are sent to Lovable AI (OpenAI). Do not include sensitive information. Live web search is not connected.</p>
    {(notice || history.error || chat.error) && <p role="alert" className="mb-4 text-sm text-destructive">{notice || history.error?.message || chat.error?.message}</p>}
    {history.isPending || (activeId && chat.isPending) ? <Shimmer>Loading your chat…</Shimmer> : chat.data ? <ChatWindow key={chat.data.chat.id} id={chat.data.chat.id} initialMessages={chat.data.messages.map(m => ({ id: m.message_id, role: m.role, parts: m.parts })) as UIMessage[]} summary={chat.data.chat.summary} /> : <div className="py-16 text-center"><img src={symbol.url} alt="Global Opportunity Finder" className="mx-auto h-16 w-auto" /><h2 className="mt-5 text-xl font-semibold">Your next opportunity</h2><Button className="mt-6" onClick={startNew} disabled={creating}>Start a conversation</Button></div>}
  </WorkspaceShell>;
}

function ChatWindow({ id, initialMessages, summary }: { id: string; initialMessages: UIMessage[]; summary: string | null }) {
  const qc = useQueryClient();
  const { user } = useUser();
  const input = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [saveError, setSaveError] = useState("");
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/assistant", body: { conversationId: id }, headers: async () => { const { data } = await supabase.auth.getSession(); return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}; } }), [id]);
  const { messages, sendMessage, status, error, stop, addToolApprovalResponse } = useChat({ id, messages: initialMessages, transport, sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses, onFinish: async ({ message, isAbort }) => {
    if (isAbort && user) {
      const parts = [...message.parts, { type: "text" as const, text: "_Stopped._" }];
      const { error: err } = await supabase.from("assistant_messages").upsert({ user_id: user.id, conversation_id: id, message_id: message.id, role: "assistant", parts: parts as Json }, { onConflict: "conversation_id,message_id" });
      if (err) setSaveError("The stopped response could not be saved.");
    }
    await qc.invalidateQueries({ queryKey: ["assistant-history"] });
    await qc.invalidateQueries({ queryKey: ["assistant-chat"] });
    await qc.invalidateQueries({ queryKey: ["saved"] });
    await qc.invalidateQueries({ queryKey: ["saved-list"] });
    await qc.invalidateQueries({ queryKey: ["saved-ids"] });
  } });
  const busy = status === "submitted" || status === "streaming";
  useEffect(() => { if (!busy) input.current?.focus(); }, [busy]);
  const send = (value: string) => { if (!value.trim() || busy) return; setText(""); void sendMessage({ text: value }); input.current?.focus(); };
  const prompts = ["Find competitions for me", "Find research programs in robotics", "Create an opportunity action plan"];
  return <div className="min-w-0">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-medium">Opportunity chat</span><Button variant="ghost" size="sm" disabled={busy || !messages.length} onClick={() => send(SUMMARY_REQUEST)}><FileText />Summarize Our Conversation</Button></div>
    {summary && <details className="mb-4 border-b border-border pb-3"><summary className="cursor-pointer text-sm font-medium">Latest conversation summary</summary><MessageResponse className="mt-3 text-sm">{summary}</MessageResponse></details>}
    <Conversation className="relative h-[min(58vh,650px)] min-h-72 border-y border-border"><ConversationContent className="gap-7 px-0 py-5">
      {!messages.length && <div className="py-8"><img src={symbol.url} alt="Global Opportunity Finder" className="h-12 w-auto" /><h2 className="mt-4 text-xl font-semibold">Big Dreams. Real Opportunities.</h2><div className="mt-6 flex flex-wrap gap-2">{prompts.map(p => <Button key={p} variant="outline" className="h-auto whitespace-normal py-3 text-left" onClick={() => send(p)}>{p}</Button>)}</div></div>}
      {messages.map(m => <Message key={m.id} from={m.role}><MessageContent className={m.role === "user" ? "bg-primary text-primary-foreground" : "w-full"}>{m.parts.map((p, i) => {
        if (p.type === "text") return <MessageResponse key={i}>{p.text}</MessageResponse>;
        if (p.type === "reasoning") return <Reasoning key={i} defaultOpen={false}><ReasoningTrigger /><ReasoningContent>{p.text}</ReasoningContent></Reasoning>;
        if (p.type.startsWith("tool-")) { const part = p as ToolUIPart; return <div key={i} className="w-full"><Tool defaultOpen={false}><ToolHeader type={part.type} state={part.state} /><ToolContent><ToolInput input={part.input} /><ToolOutput output={part.state === "output-available" ? part.output : undefined} errorText={part.state === "output-error" ? part.errorText : undefined} /></ToolContent></Tool>{part.state === "approval-requested" && <div className="mt-2 flex gap-2"><Button size="sm" onClick={() => addToolApprovalResponse({ id: part.approval.id, approved: true })}><Bookmark />Approve save</Button><Button size="sm" variant="outline" onClick={() => addToolApprovalResponse({ id: part.approval.id, approved: false })}>Decline</Button></div>}</div>; }
        return null;
      })}</MessageContent></Message>)}
      {status === "submitted" && <Shimmer>Thinking about your next steps…</Shimmer>}
    </ConversationContent><ConversationScrollButton /></Conversation>
    {(error || saveError) && <p role="alert" className="my-3 break-words text-sm text-destructive">{saveError || error?.message}</p>}
    <PromptInput className="mt-4" onSubmit={() => send(text)}><PromptInputTextarea ref={input} aria-label="Message the opportunity assistant" placeholder="Ask about opportunities, eligibility or your next steps…" value={text} onChange={e => setText(e.target.value)} disabled={busy} /><PromptInputFooter className="justify-end"><PromptInputSubmit status={status} onStop={stop} disabled={!busy && !text.trim()} /></PromptInputFooter></PromptInput>
  </div>;
}