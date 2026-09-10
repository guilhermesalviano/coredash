import { NextRequest, NextResponse } from "next/server";
import { formatResponse } from "@/lib/api-response";
import { CONFIG, SPOTIFY } from "@/config/config";
import { getSpotifyRedirectUri } from "@/utils/spotify-redirect-uri";

export async function GET(req: NextRequest) {
  if (!CONFIG.isDev) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const resolvedRedirectUri = getSpotifyRedirectUri(req.nextUrl.origin);
  return formatResponse(req, {
    resolvedRedirectUri,
    registerThisInSpotifyDashboard: resolvedRedirectUri,
    requestOrigin: req.nextUrl.origin,
    spotifyClientIdSet: !!SPOTIFY.clientId,
    spotifyClientSecretSet: !!SPOTIFY.clientSecret,
    spotifyRefreshTokenSet: !!SPOTIFY.refreshToken,
  });
}
