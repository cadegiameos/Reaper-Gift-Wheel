import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  try {
    const channelTitle = await redis.get("yt_channel_title");

    return res.status(200).json({
      title: channelTitle || null, // return null if not found
    });
  } catch (err) {
    console.error("Error fetching channel title:", err);
    return res.status(500).json({
      title: null,
      error: "Failed to fetch channel title",
    });
  }
}
