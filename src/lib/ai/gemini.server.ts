import { createGoogleGenerativeAI } from "@ai-sdk/google";
export const GEMINI_MODEL = "gemini-3.8-flash";
/** Credentials are read only by the authenticated handler and passed here, never from browser code. */
export function geminiProvider(apiKey: string, customFetch?: typeof fetch) {
  return createGoogleGenerativeAI({ apiKey, ...(customFetch ? { fetch: customFetch } : {}) });
}
