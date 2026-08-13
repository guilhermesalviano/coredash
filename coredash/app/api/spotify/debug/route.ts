import { NextRequest } from "next/server";
import { apiResponse } from "@/lib/api-response";
import { CONFIG, SPOTIFY } from "@/config/config";
import { getSpotifyRedirectUri } from "@/utils/spotify-redirect-uri";

export async function GET(req: NextRequest) {
  const resolvedRedirectUri = getSpotifyRedirectUri();
  return apiResponse(req, {
    resolvedRedirectUri,
    registerThisInSpotifyDashboard: resolvedRedirectUri,
    requestOrigin: req.nextUrl.origin,
    configBaseUrl: CONFIG.baseUrl,
    spotifyClientIdSet: !!SPOTIFY.clientId,
    spotifyClientSecretSet: !!SPOTIFY.clientSecret,
    spotifyRefreshTokenSet: !!SPOTIFY.refreshToken,
  });
}
