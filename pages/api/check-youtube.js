// /api/check-youtube.js
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  try {
    // Get stored YouTube credentials from Redis
    const accessToken = await redis.get("yt_access_token");
    const channelId = await redis.get("yt_channel_id");

    // ✅ Only fully connected when both exist
    const fullyConnected = !!accessToken && !!channelId;

    return res.status(200).json({
      accessTokenExists: !!accessToken,
      channelIdExists: !!channelId,
      exists: fullyConnected, // Frontend checks this for the green tick
    });
  } catch (err) {
    console.error("Error checking YouTube:", err);
    return res.status(500).json({ exists: false, error: err.message });
  }
}
