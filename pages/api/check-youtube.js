// pages/api/check-youtube.js
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  try {
    const accessToken = await redis.get("yt_access_token");
    const channelTitle = await redis.get("yt_channel_title");
    return res.status(200).json({ exists: !!accessToken, channelTitle: channelTitle || null });
  } catch {
    return res.status(500).json({ exists: false, channelTitle: null });
  }
}
