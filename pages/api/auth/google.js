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
  // 🔹 If no ?code yet → send user to Google
  if (!req.query.code) {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/youtube.liveChat.messages", // required for live chat access
      ],
    });
    return res.redirect(authUrl);
  }

  // 🔹 Google returned ?code → exchange for tokens
  try {
    const { tokens } = await oauth2Client.getToken(req.query.code);
    await redis.set("yt_access_token", tokens.access_token || "");
    if (tokens.refresh_token) {
      await redis.set("yt_refresh_token", tokens.refresh_token);
    }

    // ✅ Clear old channel state
    await redis.del("yt_channel_id");
    await redis.del("yt_channel_title");

    // ✅ Go to channel selection page
    return res.redirect("/connected-success");
  } catch (err) {
    console.error("OAuth2 Error:", err);
    return res.status(500).send("Authentication failed. Please try again later.");
  }
}
