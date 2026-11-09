import { createMemoryCache, createSwrCache } from "@/utils/in-memory-cache";
import { ONE_MINUTE_IN_MS } from "@/constants";
import { GmailInternalAPIResponse, GmailMessage } from "@/types/gmail";

// No stale window: an inbox that silently lags behind is worse than a short wait.
// The cache still deduplicates concurrent requests.
export const gmailListCache = createSwrCache<GmailInternalAPIResponse>({ ttlMs: ONE_MINUTE_IN_MS * 5 });
export const gmailMessageCache = createSwrCache<GmailMessage>({ ttlMs: ONE_MINUTE_IN_MS * 5 });
export const gmailAliasIdCache = createMemoryCache<string>(ONE_MINUTE_IN_MS * 5);
