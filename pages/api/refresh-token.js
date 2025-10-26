// pages/api/refresh-token.js
import { google } from "googleapis";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export async function getAuthedClient() {
  const refresh_token = await redis.get("yt_refresh_token");
  if (!refresh_token) return { client: null, reason: "NO_REFRESH" };

  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token });

  // Try to ensure access_token exists/valid
  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    const access_token = credentials.access_token;
    if (access_token) await redis.set("yt_access_token", access_token);
  } catch (e) {
    // If refresh fails, owner must re-connect
    return { client: null, reason: "REFRESH_FAILED" };
  }

  return { client: oauth2Client, reason: "OK" };
}

export default async function handler(_req, res) {
  const r = await getAuthedClient();
  if (!r.client) {
    return res.status(400).json({ ok: false, reason: r.reason });
  }
  return res.status(200).json({ ok: true });
}
