# Gemini-only AI and cost protection

## Inspection results
- The assistant already uses direct Google Gemini, exact model ID **`gemini-3.8-flash`**, with the private `GEMINI_API_KEY`. `handleAssistant` in `src/lib/ai/assistant.server.ts` serves the existing `/api/assistant` endpoint. No provider retry is configured, but one message can currently trigger up to 50 tool/model steps.
- No other active OpenAI or Lovable AI model call was found. The installed OpenAI package is unused; leaving it alone avoids unnecessary dependency changes.
- Parallel is still active in `discoverOnlineOpportunities` in `src/lib/online-opportunities.server.ts`: it makes `search`, `extract` and `responses` requests. Recommendations invoke it only through the explicit Search online button; the assistant can invoke it automatically while answering a student's message.
- College Match reads and saves student preferences only. The live database contains `college_preferences`, but no college/institution dataset table; no college API or institution matching implementation was found. Its “No verified college data connected yet” message is accurate.
- The Privacy Policy still incorrectly describes OpenAI/Lovable AI and old retention guarantees. Those specific disclosures need correcting, not a legal-page rewrite.

## Gemini live research: supported tool, unavailable on this model's free API tier
Google documents Google Search grounding for **`gemini-3.8-flash`**. The current assistant does **not** enable it: normal Gemini generation is not live research.

Google's current pricing table explicitly lists Google Search grounding for `gemini-3.8-flash` as **Not available** on the Free Tier. The Paid Tier lists 5,000 free search requests per month shared across Gemini 3 and newer models, then $14 per 1,000 requests. This paid-tier allowance is not no-billing access: model tokens can still be charged, and one prompt can trigger multiple search queries. No live grounding request was made, and no paid service or billing change was enabled.

The existing Google project's actual billing setting remains **unverified**: no accessible Google Cloud connection is available to read it, and the private Gemini API key/previous successful chat does not establish billing status. There is no reason to probe grounding to learn this; the published Free Tier limitation already rules out enabling it under the requested no-billing condition.

**Recommendation:** keep the working Gemini chat unchanged and do not enable or test Gemini grounding. No limited test is proposed because no-charge access has not been confirmed. A Google AI Studio playground trial is not proof that this app's API calls are free.

## Latest request: immediate scope is investigation only
No application code, database or billing setting has been changed. No Parallel or Gemini inference/grounding request was made during this investigation. The proposed implementation below is still unapproved and must not start automatically. In particular, College Match assistance and request-limit changes are deferred; they are not part of this investigation.

**Important current-state distinction:** Gemini grounding is not enabled, but the existing Parallel-backed `liveSearch` and recommendations button remain callable in the unchanged app. To make *all* live search disabled while retaining chat and stored catalog features, approve only the shared no-network Parallel guard, the honest unavailable tool response and disabling the manual button. This is a small follow-up, not a rebuild or database change.

Official references:
- [Model and supported capabilities](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash)
- [Google Search grounding](https://ai.google.dev/gemini-api/docs/google-search)
- [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)

## Smallest proposed changes
1. **Stop Parallel completely, retain its configuration.** Replace the shared discovery implementation with a no-network disabled result, so both normal and direct calls cannot contact Parallel. Do not delete its secret, connector, existing catalog rows or saved opportunities.
2. **Keep working Gemini chat.** Preserve authentication, history, routes, saved-item approval and the existing UI. The live-search tool must honestly report unavailable and never substitute invented results. Reduce the maximum tool/model steps from 50 to 5, retain zero provider retries and cap each model response at 2,048 output tokens.
3. **Preserve Recommended for Me and Browse Opportunities.** Stored catalog matching, browsing, filtering, saves and deadlines continue working. Disable the online-search button and explain that live search is off. Do not recheck all stored listings or claim their dates were refreshed.
4. **College Match: preference interpretation, not invented college matches.** Add an explicit “Review preferences” action using the same private Gemini connection to interpret saved major, region, institution type, budget and aid preferences. No automatic AI request on page visits or preference saves. Keep the no-verified-data notice and do not output factual college recommendations, tuition, admission rates or scholarships. Actual institution matching remains blocked until verified data is supplied.
5. **Update only affected provider/search disclosures.** Remove active Parallel wording and inaccurate OpenAI/retention claims from the assistant notice and relevant Privacy Policy paragraphs. Do not change unrelated pages.

## What stops working
- Recommended for Me's online opportunity discovery.
- The assistant's current live opportunity search and automatic ingestion/refresh of newly discovered official-source records.
- Fresh web verification of deadlines, eligibility and application status through Parallel.

Chat, existing catalog browsing/recommendations, saved opportunities, deadlines, history and saved college preferences remain available. Existing records are not evidence of current application availability.

## Costs, limits and lowest-cost alternatives
- **Parallel:** zero new requests after disabling; no new Parallel request usage from the app. Retaining configuration does not cancel any independently existing subscription.
- **Gemini:** direct requests use your Google project, not Lovable AI model credits. Eligible free-tier usage has no API charge, but exact current allowances for this project/model are unverified and must not be represented as unlimited. No paid billing or automatic model/provider fallback will be enabled. A quota failure is shown to the student; no retry loop.
- Chat will have zero provider retries, a five-step ceiling and 2,048 output tokens per model step. College preference reviews will be one explicit model request, zero retries and at most 1,024 output tokens. These bounds reduce usage but do not establish a dollar spending guarantee or a per-user daily quota.
- Development and normal hosting still use existing Lovable credits; switching the app's AI does not eliminate those costs.
- **No-cost data option:** supply a small institution dataset or official institution-page content with source URLs and verification dates. It can support real matches without purchasing an API. Until supplied, only preference interpretation is proposed; creating or populating institution storage is not included.
- For current opportunities meanwhile, students can inspect existing official links themselves. That is not automated live research. No alternative paid search provider will be added.

## Exact files/functions
| File | Scoped change |
| --- | --- |
| `src/lib/online-opportunities.server.ts` — `discoverOnlineOpportunities` | Disable all three Parallel calls at the shared entry point |
| `src/lib/ai/assistant.server.ts` — `handleAssistant`, `liveSearch` | Preserve Gemini; truthful search-unavailable response; bounded steps/output |
| `src/lib/assistant-policy.ts` — `ASSISTANT_POLICY` | Remove instruction to rely on live search when unavailable |
| `src/routes/_authenticated/recommended.tsx` | Disable manual online trigger; preserve stored matches |
| `src/lib/ai/gemini.server.ts` — new shared provider factory | Reuse direct Gemini provider/model without duplicating configuration; private key passed only from existing server handlers |
| `src/lib/college-match.functions.ts` — new authenticated preference-review function | Read owner-saved preferences, invoke Gemini once, return preference interpretation only |
| `src/routes/_authenticated/college-match.tsx` | Explicit review action and result; retain verified-data limitation |
| `src/routes/_authenticated/assistant.tsx`, `src/routes/privacy.tsx` | Correct only affected service disclosures |
| Focused tests, `AGENTS.md`, `roadmap.md` | Record and test no-Parallel and bounded-request rules; no broad checks |

`src/lib/recommendations.functions.ts` can keep calling the guarded shared discovery entry point; the route `/api/assistant` does not need changing. No secret/configuration deletion, new data table, account change or unrelated rebuild is proposed.

## Testing after approval
- **Chat:** one signed-in real Gemini message without requesting web research; confirm reply and history readback.
- **College:** one explicit preference review; confirm it reads saved preferences and produces no invented institution facts. This verifies preference assistance, not factual college matching.
- **Live search:** separately verify that manual recommendations and assistant live-search requests cannot contact Parallel, and show unavailable honestly. Do not claim Gemini live research works; it remains unimplemented and untested pending verified no-billing eligibility.
- Run only focused tests for changed rules. Stop on a failed real AI request and report the error and smallest remedy; no repeated searches or broad audits.

## Approval
Approve this scope to disable Parallel and add bounded Gemini preference assistance. **Verified college matching and Gemini live research remain blocked as described above**, rather than being advertised as completed features.