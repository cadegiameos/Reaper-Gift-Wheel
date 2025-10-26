// pages/api/check-youtube.js
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  try {
    const accessToken = await redis.get("yt_access_token");
    const channelId = await redis.get("yt_channel_id");
    const channelTitle = await redis.get("yt_channel_title");
    const fullyConnected = !!accessToken && !!channelId;

    return res.status(200).json({
      accessTokenExists: !!accessToken,
      channelIdExists: !!channelId,
      channelTitle: channelTitle || null,
      exists: fullyConnected,
    });
  } catch (err) {
    console.error("Error checking YouTube:", err);
    return res.status(500).json({ exists: false, error: err.message });
  }
}
