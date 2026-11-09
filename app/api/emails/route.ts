import { NextResponse } from "next/server";
import { getInbox } from "@/features/emails/server/gmail-inbox";
import { formatResponse } from "@/lib/api-response";
import logger from "@/lib/logger";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageToken = searchParams.get("pageToken") ?? undefined;
  const startAtRaw = Number(searchParams.get("startAt") ?? "1");
  const startAt = Number.isFinite(startAtRaw) && startAtRaw > 0 ? Math.floor(startAtRaw) : 1;

  try {
    const { data, fromCache } = await getInbox({ pageToken, startAt });
    if (fromCache) {
      logger.info("Gmail data retrieved from cache successfully");
      return formatResponse(request, { message: "Gmail data from cache successfully", data });
    }

    return formatResponse(request, { message: "Gmail data retrieved successfully", data });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: "Failed to retrieve Gmail data" }, { status: 500 });
  }
}
