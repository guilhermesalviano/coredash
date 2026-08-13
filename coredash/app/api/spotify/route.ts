import { NextRequest, NextResponse } from "next/server";
import { formatResponse } from "@/lib/api-response";
import { fetchSpotifyPlayer } from "@/services/spotify-api";
import { createMemoryCache } from "@/utils/in-memory-cache";
import { SpotifyPlayerResponse } from "@/types/spotify";
import logger from "@/lib/logger";

const spotifyCache = createMemoryCache<SpotifyPlayerResponse>(10_000); // 10 s

export async function GET(req: NextRequest) {
  const cached = spotifyCache.get("default");
  if (cached) return formatResponse(req, { data: cached });

  try {
    const data = await fetchSpotifyPlayer();
    spotifyCache.set("default", data);
    return formatResponse(req, { data });
  } catch (err: any) {
    if (err.message === "not_connected") {
      return formatResponse(req, { data: { connected: false, track: null, devices: [] } });
    }
    logger.error("Spotify GET error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
