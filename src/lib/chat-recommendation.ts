import { z } from "zod";
import { safeOfficialUrl } from "@/lib/opportunity-source";

export const chatRecommendationSchema = z.object({
  name: z.string().trim().min(1).max(250),
  description: z.string().trim().min(1).max(2000),
  category: z.enum(["volunteer", "competitions", "research", "awards"]).default("awards"),
  organizer: z.string().trim().min(1).max(250).nullable().default(null),
  deadline: z.string().nullable(),
  deadlineEstimate: z.string().trim().min(1).max(120).nullable().default(null),
  officialUrl: z.string().nullable(),
  reason: z.string().trim().min(1).max(2000),
  catalogId: z.string().uuid().nullable(),
});
export type ChatRecommendation = z.infer<typeof chatRecommendationSchema>;
export function normalizeChatRecommendation(value: ChatRecommendation): ChatRecommendation {
  return { ...value, officialUrl: safeOfficialUrl(value.officialUrl) };
}
