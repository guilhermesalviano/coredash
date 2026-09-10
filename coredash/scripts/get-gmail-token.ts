/**
 * One-time script to generate a Gmail OAuth2 refresh token.
 * Run with: npx tsx scripts/get-gmail-token.ts
 *
 * Prerequisites:
 *   - GOOGLE_GMAIL_CLIENT_ID and GOOGLE_GMAIL_CLIENT_SECRET set in .env
 *   - http://localhost:3001/oauth/callback added as Authorized Redirect URI in Google Cloud Console
 */

import http from "http";
import { URL } from "url";
import { google } from "googleapis";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const CLIENT_ID = process.env.GOOGLE_GMAIL_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_GMAIL_CLIENT_SECRET!;

const LISTEN_PORT = 3001;
const baseUrl = new URL("http://localhost:3001");
const REDIRECT_URI = `${baseUrl.protocol}//${baseUrl.hostname}:${LISTEN_PORT}/oauth/callback`;

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/gmail.modify"],
});

console.log(`\n📌 Redirect URI: ${REDIRECT_URI}`);
console.log("   ↳ Register this in Google Cloud Console → OAuth 2.0 → Authorized redirect URIs\n");
console.log("✅ Open this URL in your browser:\n");
console.log(authUrl);
console.log(`\nWaiting for callback on ${REDIRECT_URI} ...\n`);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url!, `http://localhost:${LISTEN_PORT}`);
  const code = url.searchParams.get("code");

  if (!code) {
    res.end("No code found in callback.");
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.end("<h2>✅ Success! Check your terminal for the refresh token.</h2>");

    console.log("\n🎉 Refresh token generated successfully!\n");
    console.log("Add this to your .env:\n");
    console.log(`GOOGLE_GMAIL_REFRESH_TOKEN="${tokens.refresh_token}"\n`);
  } catch (err) {
    res.end("<h2>Error exchanging code. Check terminal.</h2>");
    console.error("Error:", err);
  } finally {
    server.close();
    process.exit(0);
  }
});

server.listen(LISTEN_PORT);
