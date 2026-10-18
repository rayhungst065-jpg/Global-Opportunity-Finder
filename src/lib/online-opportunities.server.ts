import { generalLiveSearchUnavailable } from "@/lib/college-research-policy";

/** Legacy entry point retained without network access; premium search belongs only to College Research. */
export async function discoverOnlineOpportunities(..._unused: unknown[]) {
  return generalLiveSearchUnavailable();
}
