// pages/api/entries.js
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const entries = (await redis.get("wheelEntries")) || [];
      return res.status(200).json({ entries });
    } catch {
      return res.status(500).json({ message: "Failed to load" });
    }
  }

  if (req.method === "POST") {
    try {
      const { name, amount } = req.body || {};
      if (!name || Number(amount) < 1) {
        return res.status(400).json({ message: "Invalid entry" });
      }
      const existing = (await redis.get("wheelEntries")) || [];
      const newEntries = [...existing, ...Array(Number(amount)).fill(String(name))];
      await redis.set("wheelEntries", newEntries);
      return res.status(200).json({ entries: newEntries });
    } catch {
      return res.status(500).json({ message: "Failed to add" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await redis.del("wheelEntries");
      // keep processed ids to avoid duplicate imports if user clears wheel mid-stream
      return res.status(200).json({ message: "Entries cleared" });
    } catch {
      return res.status(500).json({ message: "Failed to clear" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
