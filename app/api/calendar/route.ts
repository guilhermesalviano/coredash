import { NextRequest, NextResponse } from "next/server";
import { getCalendar } from "@/features/calendar/server/get-calendar";
import { formatResponse } from "@/lib/api-response";
import logger from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const { data, fromCache } = await getCalendar();
    if (fromCache) {
      logger.info("Calendar data retrieved from cache successfully");
      return formatResponse(req, { message: "Calendar data from cache successfully", data });
    }

    return formatResponse(req, { message: "Calendar data retrieved successfully", data });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: "Failed to retrieve calendar data" }, { status: 500 });
  }
}
