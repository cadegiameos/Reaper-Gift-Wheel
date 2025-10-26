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
  // ✅ STEP 1: If there's no code, redirect to Google login
  if (!req.query.code) {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent select_account", // ensures user picks account
      include_granted_scopes: true,
      scope: [
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/youtube.channel-memberships.creator"
      ],
    });
    return res.redirect(authUrl);
  }

  // ✅ STEP 2: Try to exchange code for token
  try {
    const { tokens } = await oauth2Client.getToken(req.query.code);
    oauth2Client.setCredentials(tokens);

    await redis.set("yt_access_token", tokens.access_token);

    console.log("✅ YouTube token saved.");
    return res.redirect("/choose-channel");
  } catch (err) {
    console.error("OAuth2 Error:", err);
    return res
      .status(500)
      .send("Authentication failed. Please try again later.");
  }
}
