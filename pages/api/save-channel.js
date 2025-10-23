// pages/api/save-channel.js
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { channelId, channelTitle } = req.body;

    if (!channelId) {
      return res.status(400).json({ message: "Missing channelId" });
    }

    // ✅ Save to Redis
    await redis.set("yt_channel_id", channelId);
    if (channelTitle) {
      await redis.set("yt_channel_title", channelTitle);
    }

    return res.status(200).json({ message: "Channel saved successfully" });
  } catch (err) {
    console.error("Error saving channel:", err);
    return res.status(500).json({ message: "Error saving channel" });
  }
}
