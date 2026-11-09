import { createMemoryCache, createSwrCache } from "@/utils/in-memory-cache";
import { ONE_MINUTE_IN_MS } from "@/constants";
import { globalSingleton } from "@/lib/global-singleton";
import { GmailInternalAPIResponse, GmailMessage } from "@/types/gmail";

// The three Gmail routes are bundled separately but must see the same entries.
// No stale window: an inbox that silently lags behind is worse than a short wait.
// The caches still deduplicate concurrent requests.
export const gmailListCache = globalSingleton("gmailListCache", () =>
  createSwrCache<GmailInternalAPIResponse>({ ttlMs: ONE_MINUTE_IN_MS * 5 }));
export const gmailMessageCache = globalSingleton("gmailMessageCache", () =>
  createSwrCache<GmailMessage>({ ttlMs: ONE_MINUTE_IN_MS * 5 }));
export const gmailAliasIdCache = globalSingleton("gmailAliasIdCache", () =>
  createMemoryCache<string>(ONE_MINUTE_IN_MS * 5));
