import { gmailAliasIdCache, gmailListCache, gmailMessageCache } from "@/lib/gmail-cache";
import {
  fetchGmailMessage,
  fetchGoogleGmailAPI,
  markGmailMessageAsRead,
  resolveRecentGmailMessageId,
} from "@/services/google-gmail-api";
import type { GmailInternalAPIResponse, GmailMessage } from "@/types/gmail";

const LIST_CACHE_KEY = "default";

interface Cached<T> {
  data: T;
  fromCache: boolean;
}

async function loadInboxPage(pageToken: string | undefined, startAt: number): Promise<GmailInternalAPIResponse> {
  const result = await fetchGoogleGmailAPI({ pageToken });
  // The client addresses messages by their position in the inbox, not by Gmail ID.
  const emails = result.emails.map((email, index) => {
    const recentId = String(startAt + index);
    gmailAliasIdCache.set(recentId, email.id);
    return { ...email, id: recentId };
  });

  return { emails, nextPageToken: result.nextPageToken };
}

export async function getInbox(options: { pageToken?: string; startAt?: number } = {}): Promise<Cached<GmailInternalAPIResponse>> {
  const startAt = options.startAt ?? 1;
  // Paginated requests are not cached.
  if (options.pageToken) {
    return { data: await loadInboxPage(options.pageToken, startAt), fromCache: false };
  }
  return gmailListCache.resolve(LIST_CACHE_KEY, () => loadInboxPage(undefined, startAt));
}

async function resolveMessageId(id: string): Promise<string | null> {
  const resolvedId = gmailAliasIdCache.get(id) ?? await resolveRecentGmailMessageId(id);
  if (resolvedId && resolvedId !== id) gmailAliasIdCache.set(id, resolvedId);
  return resolvedId;
}

/** Returns null when the position or ID does not match a message. */
export async function getMessage(id: string): Promise<(Cached<GmailMessage> & { resolvedId: string }) | null> {
  const resolvedId = await resolveMessageId(id);
  if (!resolvedId) return null;
  const result = await gmailMessageCache.resolve(resolvedId, () => fetchGmailMessage(resolvedId));
  return { ...result, resolvedId };
}

/** Returns the Gmail ID that was marked, or null when the message was not found. */
export async function markMessageRead(id: string): Promise<string | null> {
  const resolvedId = await resolveMessageId(id);
  if (!resolvedId) return null;

  try {
    await markGmailMessageAsRead(resolvedId);
  } catch (error: unknown) {
    throw new MarkReadError(resolvedId, error);
  }

  // Bust the list cache so next fetch reflects the updated read status
  gmailListCache.delete(LIST_CACHE_KEY);

  const cached = gmailMessageCache.peek(resolvedId);
  if (cached) gmailMessageCache.set(resolvedId, { ...cached.data, isUnread: false });

  return resolvedId;
}

export class MarkReadError extends Error {
  constructor(public readonly resolvedId: string, public readonly cause: unknown) {
    super("Failed to mark message as read");
    this.name = "MarkReadError";
  }
}
