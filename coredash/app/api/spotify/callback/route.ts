import { NextRequest, NextResponse } from "next/server";
import { SPOTIFY } from "@/config/config";
import { writeSpotifyRefreshToken } from "@/utils/spotify-token-store";
import { getSpotifyRedirectUri } from "@/utils/spotify-redirect-uri";
import logger from "@/lib/logger";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    logger.warn("Spotify OAuth cancelled or errored:", error);
    return NextResponse.redirect(new URL("/?spotify=cancelled", req.nextUrl.origin));
  }

  const origin = req.nextUrl.origin;
  const redirectUri = getSpotifyRedirectUri(origin);

  try {
    logger.info(`[spotify/callback] exchanging code, redirect_uri=${redirectUri}`);

    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(`${SPOTIFY.clientId}:${SPOTIFY.clientSecret}`).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokens = await res.json();
    logger.info(`[spotify/callback] token response status=${res.status} keys=${Object.keys(tokens).join(",")}`);

    if (!res.ok) {
      logger.error(`[spotify/callback] Spotify error: ${JSON.stringify(tokens)}`);
      const reason = encodeURIComponent(tokens.error_description ?? tokens.error ?? "unknown");
      return NextResponse.redirect(new URL(`/?spotify=error&reason=${reason}`, origin));
    }

    if (!tokens.refresh_token) {
      logger.error("[spotify/callback] No refresh_token in response:", JSON.stringify(tokens));
      throw new Error("No refresh_token in response");
    }

    writeSpotifyRefreshToken(tokens.refresh_token);
    logger.info("Spotify refresh token saved successfully.");

    return NextResponse.redirect(new URL("/?spotify=connected", origin));
  } catch (err: any) {
    logger.error("Spotify OAuth callback error:", err);
    const reason = encodeURIComponent(err.message);
    return NextResponse.redirect(new URL(`/?spotify=error&reason=${reason}`, origin));
  }
}
