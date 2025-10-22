import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_URL, // or UPSTASH_REDIS_REST_URL if using default
  token: process.env.KV_REST_API_TOKEN, // or UPSTASH_REDIS_REST_TOKEN
});

export default async function handler(req, res) {
  if (req.method === "GET") {
    const entries = (await redis.get("wheelEntries")) || [];
    return res.status(200).json({ entries });
  }

  if (req.method === "POST") {
    const { name, amount } = JSON.parse(req.body);
    if (!name || amount < 1) {
      return res.status(400).json({ message: "Invalid entry" });
    }

    const existing = (await redis.get("wheelEntries")) || [];
    const newEntries = [...existing, ...Array(amount).fill(name)];
    await redis.set("wheelEntries", newEntries);

    return res.status(200).json({ entries: newEntries });
  }

  if (req.method === "DELETE") {
    await redis.del("wheelEntries");
    return res.status(200).json({ message: "Entries cleared" });
  }

  return res.status(405).json({ message: "Method not allowed" });
}
