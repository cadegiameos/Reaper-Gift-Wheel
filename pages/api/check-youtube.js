// pages/api/check-youtube.js
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(_req, res) {
  try {
    const channelId = await redis.get("yt_channel_id");
    const channelTitle = await redis.get("yt_channel_title");
    const refresh = await redis.get("yt_refresh_token");
    return res.status(200).json({
      configured: !!(channelId && refresh),
      channelId: channelId || null,
      channelTitle: channelTitle || null,
    });
  } catch {
    return res.status(200).json({ configured: false });
  }
}
