import { Redis } from "@upstash/redis";
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  try {
    const token = await redis.get("YT_REFRESH_TOKEN");
    res.status(200).json({ exists: !!token });
  } catch (err) {
    res.status(500).json({ exists: false });
  }
}
