import { createMemoryCache } from "@/utils/in-memory-cache";
import { ONE_MINUTE_IN_MS } from "@/constants";
import { GmailInternalAPIResponse, GmailMessage } from "@/types/gmail";

export const gmailListCache = createMemoryCache<GmailInternalAPIResponse>(ONE_MINUTE_IN_MS * 5);
export const gmailMessageCache = createMemoryCache<GmailMessage>(ONE_MINUTE_IN_MS * 5);
export const gmailAliasIdCache = createMemoryCache<string>(ONE_MINUTE_IN_MS * 5);
