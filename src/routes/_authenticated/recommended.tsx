import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { WorkspaceShell } from "@/components/site/WorkspaceShell";
import { Button } from "@/components/ui/button";
import { ChatRecommendation } from "@/components/site/ChatRecommendation";
import { chatRecommendationSchema } from "@/lib/chat-recommendation";
import { savedChatRecommendations, removeChatRecommendation } from "@/lib/chat-recommendations.functions";
import { useUser } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/recommended")({
  head: () => ({ meta: [
    { title: "Recommended for Me — Global Opportunity Finder" },
    { name: "description", content: "Your saved original Gemini chat opportunity recommendations." },
    { property: "og:title", content: "Recommended for Me — Global Opportunity Finder" },
    { property: "og:description", content: "Revisit the opportunities you saved from your private Gemini chat." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: Recommended,
});
function Recommended() {
  const { user } = useUser();
  const listFn = useServerFn(savedChatRecommendations);
  const removeFn = useServerFn(removeChatRecommendation);
  const qc = useQueryClient();
  const saved = useQuery({ queryKey: ["chat-recommendations", user?.id], queryFn: () => listFn(), enabled: !!user, retry: false });
  const remove = useMutation({ mutationFn: (id: string) => removeFn({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-recommendations"] }) });
  return <WorkspaceShell title="Recommended for Me" subtitle="The original opportunities you chose to save from your Gemini conversations.">
    {(saved.error || remove.error) && <p role="alert" className="mb-4 text-sm text-destructive">{saved.error?.message || remove.error?.message}</p>}
    {saved.isPending ? <p role="status" className="text-muted-foreground">Loading your recommendations…</p> : !saved.data?.length ? <p className="text-muted-foreground">No saved chat recommendations yet. <Link to="/assistant" className="text-primary hover:underline">Open AI Chat</Link></p> : <div className="grid gap-5 md:grid-cols-2">{saved.data.map(row => {
      const parsed = chatRecommendationSchema.safeParse(row.recommendation);
      if (!parsed.success) return null;
      return <ChatRecommendation key={row.id} recommendation={parsed.data} action={<Button variant="outline" size="sm" disabled={remove.isPending} onClick={() => remove.mutate(row.id)}><Trash2 />Remove</Button>} />;
    })}</div>}
  </WorkspaceShell>;
}
