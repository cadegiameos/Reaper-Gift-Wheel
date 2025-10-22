import { Redis } from "@upstash/redis";

export const config = {
  api: {
    bodyParser: false, // We'll parse manually
  },
};

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const entries = (await redis.get("wheelEntries")) || [];
      return res.status(200).json({ entries });
    }

    if (req.method === "POST") {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      const data = JSON.parse(Buffer.concat(buffers).toString("utf-8"));

      const { name, amount } = data;
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
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
