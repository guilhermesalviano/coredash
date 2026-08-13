import { NextRequest, NextResponse } from "next/server";
import { formatResponse } from "@/lib/api-response";
import { fetchSpotifySearch } from "@/services/spotify-api";
import logger from "@/lib/logger";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return formatResponse(req, { data: [] });

  try {
    const data = await fetchSpotifySearch(q);
    return formatResponse(req, { data });
  } catch (err: any) {
    logger.error("Spotify search error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
