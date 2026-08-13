import { NextRequest } from "next/server";
import { apiResponse } from "@/lib/api-response";
import { fetchSpotifyPlayer } from "@/services/spotify-api";
import { createMemoryCache } from "@/utils/in-memory-cache";
import { SpotifyPlayerResponse } from "@/types/spotify";
import logger from "@/lib/logger";

const spotifyCache = createMemoryCache<SpotifyPlayerResponse>(10_000); // 10 s

export async function GET(req: NextRequest) {
  const cached = spotifyCache.get("default");
  if (cached) return apiResponse(req, { data: cached });

  try {
    const data = await fetchSpotifyPlayer();
    spotifyCache.set("default", data);
    return apiResponse(req, { data });
  } catch (err: any) {
    if (err.message === "not_connected") {
      return apiResponse(req, { data: { connected: false, track: null, devices: [] } });
    }
    logger.error("Spotify GET error", err);
    return apiResponse(req, { error: err.message }, { status: 500 });
  }
}
