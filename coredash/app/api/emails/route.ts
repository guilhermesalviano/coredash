import { fetchGoogleGmailAPI } from "@/services/google-gmail-api";
import { gmailAliasIdCache, gmailListCache } from "@/lib/gmail-cache";
import { GmailInternalAPIResponse } from "@/types/gmail";
import { apiResponse } from "@/lib/api-response";
import logger from "@/lib/logger";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageToken = searchParams.get("pageToken") ?? undefined;
  const startAtRaw = Number(searchParams.get("startAt") ?? "1");
  const startAt = Number.isFinite(startAtRaw) && startAtRaw > 0 ? Math.floor(startAtRaw) : 1;

  // Don't cache paginated requests
  if (!pageToken) {
    const cached = gmailListCache.get("default");
    if (cached) {
      logger.info("Gmail data retrieved from cache successfully");
      return apiResponse(request, { message: "Gmail data from cache successfully", data: cached });
    }
  }

  try {
    const result = await fetchGoogleGmailAPI({ pageToken });
    const emailsWithRecentId = result.emails.map((email, index) => {
      const recentId = String(startAt + index);
      gmailAliasIdCache.set(recentId, email.id);
      return {
        ...email,
        id: recentId,
      };
    });

    const responseBody: GmailInternalAPIResponse = {
      emails: emailsWithRecentId,
      nextPageToken: result.nextPageToken,
    };

    if (!pageToken) gmailListCache.set("default", responseBody);

    return apiResponse(request, { message: "Gmail data retrieved successfully", data: responseBody });
  } catch (error: unknown) {
    console.error(error);
    return apiResponse(request, { error: "Failed to retrieve Gmail data" }, { status: 500 });
  }
}
