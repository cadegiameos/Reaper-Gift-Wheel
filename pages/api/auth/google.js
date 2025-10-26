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
  // STEP 1: Start OAuth if we don't have a code yet
  if (!req.query.code) {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent", // ensures we get a refresh_token on first connect
      scope: [
        // Read channel list and live-related info
        "https://www.googleapis.com/auth/youtube.readonly",

        // Needed in practice to reliably call liveChatMessages.list with OAuth.
        // (Text sounds strong but we are only calling read endpoints.)
        "https://www.googleapis.com/auth/youtube.force-ssl",
      ],
    });
    return res.redirect(authUrl);
  }

  // STEP 2: Exchange code for tokens and persist
  try {
    const { tokens } = await oauth2Client.getToken(req.query.code);

    await redis.set("yt_access_token", tokens.access_token || "");
    if (tokens.refresh_token) {
      await redis.set("yt_refresh_token", tokens.refresh_token);
    }

    // Mark this browser as the “editor” session (can clear the wheel, etc.)
    res.setHeader("Set-Cookie", [
      // 30 days, httpOnly for safety
      "yt_editor=1; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000",
    ]);

    // Clear any previous selection so the user re-chooses after connecting
    await redis.del("yt_channel_id");
    await redis.del("yt_channel_title");

    // Go to the success/chooser screen
    return res.redirect("/connected-success");
  } catch (err) {
    console.error("OAuth2 Error:", err);
    return res
      .status(500)
      .send("Authentication failed. Please try again later.");
  }
}
