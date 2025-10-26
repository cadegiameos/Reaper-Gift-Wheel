import { google } from "googleapis";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google`
);

export default async function handler(req, res) {
  try {
    let refreshToken = await redis.get("yt_refresh_token");
    if (!refreshToken) {
      return res.status(401).json({ message: "Missing refresh token." });
    }

    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();
    await redis.set("yt_access_token", credentials.access_token);

    return res.status(200).json({ message: "Token refreshed successfully" });
  } catch (err) {
    console.error("Error refreshing token:", err);
    return res.status(500).json({ message: "Refresh failed" });
  }
}
