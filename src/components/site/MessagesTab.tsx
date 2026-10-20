import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { MessageSquare, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar } from "@/components/site/Avatar";
import type { ConnectionRow } from "@/lib/connections.functions";

type Msg = { id: string; sender_id: string; recipient_id: string; body: string; created_at: string };

/** One-to-one messages with accepted friends. RLS: participants read; only friends can send as themselves. */
export function MessagesTab({ userId, rows, selected, onSelect }: { userId: string; rows: ConnectionRow[]; selected: string | null; onSelect: (id: string) => void }) {
  const qc = useQueryClient();
  const friends = rows.filter((r) => r.status === "accepted" && r.other).map((r) => r.other!);
  const others = new Map(rows.filter((r) => r.other).map((r) => [r.other!.id, r.other!]));

  const all = useQuery({
    queryKey: ["student-messages", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("student_messages").select("*").order("created_at", { ascending: true }).limit(1000);
      if (error) throw error;
      return data as Msg[];
    },
  });

  useEffect(() => {
    const ch = supabase.channel(`dm-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "student_messages" }, () => qc.invalidateQueries({ queryKey: ["student-messages", userId] }))
      .subscribe();
    const t = setInterval(() => qc.invalidateQueries({ queryKey: ["student-messages", userId] }), 15000);
    return () => { supabase.removeChannel(ch); clearInterval(t); };
  }, [userId, qc]);

  const msgs = all.data ?? [];
  const peerOf = (m: Msg) => (m.sender_id === userId ? m.recipient_id : m.sender_id);
  const lastBy = new Map<string, Msg>();
  for (const m of msgs) lastBy.set(peerOf(m), m);
  const convoIds = [...new Set([...[...lastBy.keys()].reverse(), ...friends.map((f) => f.id)])];
  const active = selected ?? convoIds[0] ?? null;
  const thread = msgs.filter((m) => peerOf(m) === active);
  const isFriend = !!active && friends.some((f) => f.id === active);

  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const send = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("student_messages").insert({ sender_id: userId, recipient_id: active!, body: text.trim() });
      if (error) throw new Error(error.message.includes("row-level security") ? "You can only message accepted friends." : error.message);
    },
    onSuccess: () => { setText(""); setErr(""); qc.invalidateQueries({ queryKey: ["student-messages", userId] }); },
    onError: (e) => setErr(e instanceof Error ? e.message : "Couldn't send."),
  });

  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [thread.length, active]);

  if (all.isLoading) return <p className="text-sm text-muted-foreground">Loading messages…</p>;
  if (all.isError) return <p className="text-sm text-destructive">Couldn't load messages. Please refresh.</p>;
  if (convoIds.length === 0) return (
    <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
      <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground" />
      <h2 className="mt-4 font-display text-xl font-semibold">No conversations yet</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">You can message students once they accept your friend request. <Link to="/communities" className="text-primary hover:underline">Find students</Link>.</p>
    </div>
  );

  const name = (id: string) => others.get(id)?.display_name ?? "Student";
  return (
    <div className="grid gap-4 md:grid-cols-[16rem_1fr]">
      <ul className="space-y-1 rounded-2xl border border-border bg-card p-2">
        {convoIds.map((id) => (
          <li key={id}>
            <button onClick={() => onSelect(id)} className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition ${id === active ? "bg-primary-soft" : "hover:bg-accent"}`}>
              <Avatar path={others.get(id)?.avatar_path} name={name(id)} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{name(id)}</span>
                <span className="block truncate text-xs text-muted-foreground">{lastBy.get(id)?.body ?? "Start a conversation"}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {active && (
        <section className="flex min-h-[24rem] flex-col rounded-2xl border border-border bg-card">
          <header className="border-b border-border px-5 py-3 font-medium">
            <Link to="/students/$id" params={{ id: active }} className="hover:underline">{name(active)}</Link>
          </header>
          <div className="max-h-[28rem] flex-1 space-y-3 overflow-y-auto p-5">
            {thread.length === 0 && <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>}
            {thread.map((m) => {
              const mine = m.sender_id === userId;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className="mt-1 text-[11px] opacity-70">{mine ? "You" : name(m.sender_id)} · {new Date(m.created_at).toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
            <div ref={end} />
          </div>
          {isFriend ? (
            <form className="flex gap-2 border-t border-border p-3" onSubmit={(e) => { e.preventDefault(); if (text.trim()) send.mutate(); }}>
              <input aria-label="Message" value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} placeholder="Write a message…"
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-ring" />
              <button disabled={send.isPending || !text.trim()} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50">
                <Send className="h-4 w-4" /> Send
              </button>
            </form>
          ) : <p className="border-t border-border p-3 text-sm text-muted-foreground">You're no longer friends, so new messages can't be sent. Earlier messages are kept.</p>}
          {err && <p role="alert" className="px-3 pb-3 text-sm text-destructive">{err}</p>}
        </section>
      )}
    </div>
  );
}
