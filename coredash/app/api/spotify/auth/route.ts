import { NextRequest, NextResponse } from "next/server";
import { SPOTIFY } from "@/config/config";
import { getSpotifyRedirectUri } from "@/utils/spotify-redirect-uri";

const SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "playlist-read-private",
  "user-library-read",
  "user-read-recently-played",
].join(" ");

export async function GET(req: NextRequest) {
  if (!SPOTIFY.clientId || !SPOTIFY.clientSecret) {
    return NextResponse.json(
      { error: "Spotify credentials not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET." },
      { status: 500 }
    );
  }

  const redirectUri = getSpotifyRedirectUri(req.nextUrl.origin);

  const url =
    "https://accounts.spotify.com/authorize?" +
    new URLSearchParams({
      response_type: "code",
      client_id: SPOTIFY.clientId,
      scope: SCOPES,
      redirect_uri: redirectUri,
    });

  return NextResponse.redirect(url);
}
