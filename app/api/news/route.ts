import { NextRequest, NextResponse } from "next/server";
import { formatResponse } from "@/lib/api-response";
import { errorMessage } from "@/lib/api-error";
import { getNews } from "@/features/news/server/get-news";

export async function GET(req: NextRequest) {
  try {
    return formatResponse(req, { message: "News data retrieved successfully", data: await getNews() });
  } catch (error: unknown) {
    return NextResponse.json({ error: "Failed to retrieve news data", reason: errorMessage(error) }, { status: 503 });
  }
}
