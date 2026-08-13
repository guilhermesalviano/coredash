import { fetchGmailMessage, resolveRecentGmailMessageId } from "@/services/google-gmail-api";
import { gmailAliasIdCache, gmailMessageCache } from "@/lib/gmail-cache";
import { GmailMessage } from "@/types/gmail";
import { apiResponse } from "@/lib/api-response";
import logger from "@/lib/logger";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) {
    return apiResponse(request, { error: "Missing required route param: id" }, { status: 400 });
  }

  const resolvedId = gmailAliasIdCache.get(id) ?? await resolveRecentGmailMessageId(id);

  if (!resolvedId) {
    return apiResponse(request, { error: "Email not found" }, { status: 404 });
  }

  if (resolvedId !== id) {
    gmailAliasIdCache.set(id, resolvedId);
  }

  const cached = gmailMessageCache.get(resolvedId);
  if (cached) {
    logger.info(`Gmail message ${resolvedId} retrieved from cache`);
    return apiResponse(request, { message: "Email retrieved from cache", data: cached });
  }

  try {
    const email = await fetchGmailMessage(resolvedId);

    gmailMessageCache.set(resolvedId, email);

    return apiResponse(request, { message: "Email retrieved successfully", data: email });
  } catch (error: unknown) {
    console.error(error);
    return apiResponse(request, { error: "Failed to retrieve Gmail message" }, { status: 500 });
  }
}
