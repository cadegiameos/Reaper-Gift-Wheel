import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  try {
    const token = await redis.get("yt_access_token");
    if (token) {
      return res.status(200).json({ exists: true });
    } else {
      return res.status(200).json({ exists: false });
    }
  } catch (err) {
    console.error("check-youtube error:", err);
    return res.status(500).json({ exists: false, error: err.message });
  }
}
