import { NextRequest, NextResponse } from "next/server";
import { formatResponse } from "@/lib/api-response";
import { CONFIG, SPOTIFY } from "@/config/config";
import { getSpotifyRedirectUri } from "@/utils/spotify-redirect-uri";

export async function GET(req: NextRequest) {
  if (!CONFIG.isDev) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const resolvedRedirectUri = getSpotifyRedirectUri();
  return formatResponse(req, {
    resolvedRedirectUri,
    registerThisInSpotifyDashboard: resolvedRedirectUri,
    requestOrigin: req.nextUrl.origin,
    configBaseUrl: CONFIG.baseUrl,
    spotifyClientIdSet: !!SPOTIFY.clientId,
    spotifyClientSecretSet: !!SPOTIFY.clientSecret,
    spotifyRefreshTokenSet: !!SPOTIFY.refreshToken,
  });
}
