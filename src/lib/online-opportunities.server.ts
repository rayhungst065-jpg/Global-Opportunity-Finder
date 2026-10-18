import { generalLiveSearchUnavailable } from "@/lib/college-research-policy";

/** Legacy entry point retained without network access. */
export async function discoverOnlineOpportunities(..._unused: unknown[]) {
  return generalLiveSearchUnavailable();
}
