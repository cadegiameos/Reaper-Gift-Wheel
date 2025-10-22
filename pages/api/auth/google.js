import { google } from "googleapis";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

// 👇 Use your deployed site as the base URL
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google`;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

export default async function handler(req, res) {
  // Step 1: if no auth code yet, send user to Google's OAuth page
  if (!req.query.code) {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/youtube.force-ssl",
      ],
    });
    return res.redirect(authUrl);
  }

  // Step 2: exchange the authorization code for access tokens
  try {
    const { tokens } = await oauth2Client.getToken(req.query.code);
    oauth2Client.setCredentials(tokens);

    // Store access token for polling the YouTube chat
    await redis.set("yt_access_token", tokens.access_token);
    console.log("✅ YouTube access token saved to Redis");

    // Redirect user back home
    return res.redirect("/");
  } catch (error) {
    console.error("OAuth2 Error:", error);
    return res
      .status(500)
      .send("Authentication failed. Please try again later.");
  }
}
