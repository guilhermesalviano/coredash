import { NextRequest, NextResponse } from "next/server";
import { formatResponse } from "@/lib/api-response";
import { errorMessage } from "@/lib/api-error";
import { getWeatherData } from "@/features/weather/server/get-weather";

export async function GET(req: NextRequest) {
  try {
    const rawLimit = req.nextUrl.searchParams.get("limit");
    const limit = rawLimit ? Number(rawLimit) : undefined;
    if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
      return formatResponse(req, { error: "limit must be a positive integer" }, { status: 400 });
    }
    return formatResponse(req, { message: "Weather data retrieved successfully", data: await getWeatherData(limit) });
  } catch (error: unknown) {
    return NextResponse.json({ error: "Failed to retrieve weather data", reason: errorMessage(error) }, { status: 503 });
  }
}
