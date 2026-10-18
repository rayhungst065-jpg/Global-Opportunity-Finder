import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { safeOfficialUrl } from "@/lib/opportunity-source";
import type { ChatRecommendation as Recommendation } from "@/lib/chat-recommendation";
import type { ReactNode } from "react";

export function ChatRecommendation({ recommendation: r, action }: { recommendation: Recommendation; action?: ReactNode }) {
  const url = safeOfficialUrl(r.officialUrl);
  return <article className="rounded-lg border border-border bg-card p-5">
    <h3 className="text-lg font-semibold break-words">{r.name}</h3>
    <p className="mt-2 text-sm break-words">{r.description}</p>
    <p className="mt-3 text-sm text-muted-foreground">Deadline: {r.deadline || "Not available"}</p>
    <p className="mt-3 text-sm break-words"><span className="font-medium">Why Gemini recommended it: </span>{r.reason}</p>
    <p className="mt-3 text-xs text-muted-foreground">From your Gemini chat · Not independently verified</p>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      {url ? <Button asChild variant="link" className="h-auto whitespace-normal p-0"><a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink />Official opportunity</a></Button> : <span className="text-xs text-muted-foreground">Official link not available</span>}
      {action}
    </div>
  </article>;
}