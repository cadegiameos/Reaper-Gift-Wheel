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
  // Step 1: If no code, begin OAuth flow
  if (!req.query.code) {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent select_account", // ✅ Forces channel/account selection
      scope: [
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/youtube.channel-memberships.creator",
      ],
    });
    return res.redirect(authUrl);
  }

  // Step 2: Exchange code for tokens
  try {
    const { tokens } = await oauth2Client.getToken(req.query.code);
    oauth2Client.setCredentials(tokens);

    // ✅ Save access token
    await redis.set("yt_access_token", tokens.access_token);

    console.log("✅ YouTube token saved. Redirecting to channel chooser.");

    // ✅ Redirect user to channel selection
    return res.redirect("/connected-success");
  } catch (err) {
    console.error("OAuth2 Error:", err);
    return res.status(500).send("Authentication failed. Please try again later.");
  }
}
