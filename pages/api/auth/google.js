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

// One OAuth client we use only for the owner setup
const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Scopes that allow:
// - reading YouTube channel info / broadcasts
// - reading Live Chat messages (force-ssl is the one the API accepts server-side)
const SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube.force-ssl",
];

export default async function handler(req, res) {
  // Step 1: send owner to consent
  if (!req.query.code) {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: SCOPES,
    });
    return res.redirect(authUrl);
  }

  // Step 2: exchange code → tokens, save refresh + channel
  try {
    const { tokens } = await oauth2Client.getToken(req.query.code);
    // persist tokens (refresh is the long-term keeper)
    if (tokens.refresh_token) await redis.set("yt_refresh_token", tokens.refresh_token);
    if (tokens.access_token) await redis.set("yt_access_token", tokens.access_token);

    // Build an authed client with the access just obtained
    const authed = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    authed.setCredentials({ access_token: tokens.access_token });

    const youtube = google.youtube({ version: "v3", auth: authed });

    // IMPORTANT: Owner must select the correct *Brand* identity in Google’s account chooser.
    // We read "mine:true" to get the channel that belongs to that chosen identity.
    const chanResp = await youtube.channels.list({
      part: "snippet",
      mine: true,
      maxResults: 1,
    });

    const ch = (chanResp.data.items || [])[0];
    if (!ch) {
      return res
        .status(400)
        .send("No channel found for this Google identity. Reconnect and choose the Brand account.");
    }

    await redis.set("yt_channel_id", ch.id);
    await redis.set("yt_channel_title", ch.snippet?.title || "YouTube Channel");

    // Owner setup done — send back to wheel
    return res.redirect("/?configured=1");
  } catch (err) {
    console.error("OAuth2 Error:", err?.response?.data || err);
    return res.status(500).send("Authentication failed. Please try again later.");
  }
}
