import { NextRequest, NextResponse } from "next/server";
import { formatResponse } from "@/lib/api-response";
import { CONFIG } from "@/config/config";
import { getResolvedRuntimeSettings } from "@/features/settings/server/runtime-settings";
import { getSpotifyRedirectUri } from "@/utils/spotify-redirect-uri";

export async function GET(req: NextRequest) {
  if (!CONFIG.isDev) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const resolvedRedirectUri = getSpotifyRedirectUri(req.nextUrl.origin);
  const settings = await getResolvedRuntimeSettings();
  return formatResponse(req, {
    resolvedRedirectUri,
    registerThisInSpotifyDashboard: resolvedRedirectUri,
    requestOrigin: req.nextUrl.origin,
    spotifyClientIdSet: !!settings.spotifyClientId,
    spotifyClientSecretSet: !!settings.spotifyClientSecret,
    spotifyRefreshTokenSet: !!settings.spotifyRefreshToken,
  });
}
