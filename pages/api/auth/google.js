// pages/api/auth/google.js
import { google } from "googleapis";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google`;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

export default async function handler(req, res) {
  // Step 1: no code yet → send user to Google with explicit account/channel picker
  if (!req.query.code) {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",               // get refresh_token on first consent
      include_granted_scopes: true,         // incremental auth
      prompt: "consent select_account",     // <-- force account/Brand Account chooser
      scope: [
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/youtube.channel-memberships.creator",
      ],
    });
    return res.redirect(authUrl);
  }

  // Step 2: exchange code for tokens and stash them
  try {
    const { tokens } = await oauth2Client.getToken(req.query.code);
    oauth2Client.setCredentials(tokens);

    // Save short-lived access token (and refresh if provided)
    if (tokens.access_token) {
      await redis.set("yt_access_token", tokens.access_token);
    }
    if (tokens.refresh_token) {
      await redis.set("yt_refresh_token", tokens.refresh_token);
    }

    // When reconnecting, clear previous chosen channel so the user picks again
    await redis.del("yt_channel_id");
    await redis.del("yt_channel_title");

    // Go to the “connected” screen (which then fetches channels)
    return res.redirect("/connected-success");
  } catch (err) {
    console.error("OAuth2 Error:", err);
    return res.status(500).send("Authentication failed. Please try again later.");
  }
}
