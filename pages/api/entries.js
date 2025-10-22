import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_URL, // Using your existing environment variable
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      // Get existing entries
      const entries = (await redis.get("wheelEntries")) || [];
      return res.status(200).json({ entries });
    }

    if (req.method === "POST") {
      const { name, amount } = JSON.parse(req.body);
      if (!name || amount < 1)
        return res.status(400).json({ message: "Invalid entry" });

      // Add new entries
      const existing = (await redis.get("wheelEntries")) || [];
      const newEntries = [...existing, ...Array(amount).fill(name)];
      await redis.set("wheelEntries", newEntries);

      return res.status(200).json({ entries: newEntries });
    }

    if (req.method === "DELETE") {
      // Clear all entries
      await redis.del("wheelEntries");
      return res.status(200).json({ message: "Entries cleared" });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
