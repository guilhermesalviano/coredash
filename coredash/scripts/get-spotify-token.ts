/**
 * One-time script to generate a Spotify OAuth2 refresh token.
 * Run with: npx tsx scripts/get-spotify-token.ts
 *
 * Prerequisites:
 *   - SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET set in .env
 *   - http://localhost:3001/callback added as Redirect URI in Spotify Developer Dashboard
 */

import http from "http";
import { URL } from "url";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;

const LISTEN_PORT = 3001;
const REDIRECT_URI = `http://localhost:${LISTEN_PORT}/callback`;

const SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "playlist-read-private",
  "user-library-read",
  "user-read-recently-played",
].join(" ");

const authUrl =
  "https://accounts.spotify.com/authorize?" +
  new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
  });

console.log(`\n📌 Redirect URI: ${REDIRECT_URI}`);
console.log("   ↳ Register this in Spotify Developer Dashboard → your app → Edit Settings\n");
console.log("✅ Open this URL in your browser:\n");
console.log(authUrl);
console.log(`\nWaiting for callback on ${REDIRECT_URI} …\n`);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url!, `http://localhost:${LISTEN_PORT}`);
  const code = url.searchParams.get("code");

  if (!code) {
    res.end("No authorization code found.");
    return;
  }

  try {
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokens = await tokenRes.json() as any;
    if (!tokens.refresh_token) {
      res.end(`<h2>Error: ${JSON.stringify(tokens)}</h2>`);
      return;
    }

    res.end("<h2>✅ Success! Check your terminal for the refresh token.</h2>");

    console.log("\n🎉 Refresh token generated!\n");
    console.log("Add this to your .env:\n");
    console.log(`SPOTIFY_REFRESH_TOKEN="${tokens.refresh_token}"\n`);
  } catch (err) {
    res.end("<h2>Error exchanging code. Check terminal.</h2>");
    console.error("Error:", err);
  } finally {
    server.close();
    process.exit(0);
  }
});

server.listen(LISTEN_PORT);
