// pages/api/clear-wheel.js
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await redis.del("wheelEntries");
    await redis.del("processedGiftIds");
    return res.status(200).json({ message: "Wheel and gift history cleared" });
  } catch (err) {
    console.error("Error clearing wheel:", err);
    return res.status(500).json({ message: "Error clearing wheel" });
  }
}
