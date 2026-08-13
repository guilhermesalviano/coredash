import { NextRequest } from "next/server";
import { apiResponse } from "@/lib/api-response";
import { fetchSpotifySearch } from "@/services/spotify-api";
import logger from "@/lib/logger";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return apiResponse(req, { data: [] });

  try {
    const data = await fetchSpotifySearch(q);
    return apiResponse(req, { data });
  } catch (err: any) {
    logger.error("Spotify search error", err);
    return apiResponse(req, { error: err.message }, { status: 500 });
  }
}
