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
  // Step 1: no code → send user to Google consent
  if (!req.query.code) {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/youtube.readonly",
        // (Optional) If you want to call liveChatMessages.list reliably.
        "https://www.googleapis.com/auth/youtube.force-ssl",
      ],
    });
    return res.redirect(authUrl);
  }

  // Step 2: exchange code for tokens and store
  try {
    const { tokens } = await oauth2Client.getToken(req.query.code);
    await redis.set("yt_access_token", tokens.access_token || "");
    if (tokens.refresh_token) {
      await redis.set("yt_refresh_token", tokens.refresh_token);
    }

    // mark this browser as the “editor” session that can clear the wheel
    res.setHeader("Set-Cookie", [
      `yt_editor=1; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`, // 30 days
    ]);

    return res.redirect("/connected-success");
  } catch (err) {
    console.error("OAuth2 Error:", err);
    return res.status(500).send("Authentication failed. Please try again later.");
  }
}
