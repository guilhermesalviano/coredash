import { NextRequest } from "next/server";
import { apiResponse } from "@/lib/api-response";
import { fetchSpotifyLibrary } from "@/services/spotify-api";
import { createMemoryCache } from "@/utils/in-memory-cache";
import { SpotifyLibrary } from "@/types/spotify";
import logger from "@/lib/logger";

const libraryCache = createMemoryCache<SpotifyLibrary>(60_000); // 1 min

export async function GET(req: NextRequest) {
  const cached = libraryCache.get("default");
  if (cached) return apiResponse(req, { data: cached });

  try {
    const data = await fetchSpotifyLibrary();
    libraryCache.set("default", data);
    return apiResponse(req, { data });
  } catch (err: any) {
    logger.error("Spotify library error", err);
    return apiResponse(req, { error: err.message }, { status: 500 });
  }
}
