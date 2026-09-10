/**
 * Returns the Spotify OAuth redirect URI for the current request origin.
 * Register this exact value in your Spotify Developer Dashboard.
 */
export function getSpotifyRedirectUri(origin: string): string {
  return `${origin.replace(/\/$/, "")}/api/spotify/callback`;
}
