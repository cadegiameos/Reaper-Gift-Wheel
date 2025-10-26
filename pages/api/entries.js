// pages/api/entries.js
import { Redis } from "@upstash/redis";
<<<<<<< HEAD

const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_REST_API_TOKEN,
});
=======
const redis = Redis.fromEnv();
>>>>>>> 2cb884d (final)

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
<<<<<<< HEAD
      }
      const existing = (await redis.get("wheelEntries")) || [];
      const newEntries = [
        ...existing,
        ...Array(Number(amount)).fill(String(name)),
      ];
=======
        }
      const existing = (await redis.get("wheelEntries")) || [];
      const newEntries = [...existing, ...Array(Number(amount)).fill(String(name))];
>>>>>>> 2cb884d (final)
      await redis.set("wheelEntries", newEntries);
      return res.status(200).json({ entries: newEntries });
    } catch {
      return res.status(500).json({ message: "Failed to add" });
    }
  }

  if (req.method === "DELETE") {
    try {
<<<<<<< HEAD
      // Allow DELETE only if this browser has the editor cookie
      const cookieHeader = req.headers.cookie || "";
      const hasEditorCookie = cookieHeader
        .split(/;\s*/)
        .some((c) => c.startsWith("yt_editor="));

      if (!hasEditorCookie) {
        return res.status(403).json({
          message: "Only the connected YouTube editor can clear the wheel.",
        });
      }

      await redis.del("wheelEntries");
      await redis.del("processedGiftIds");
=======
      // Optional extra lock: allow only connected session to clear
      const accessToken = await redis.get("yt_access_token");
      if (!accessToken) {
        return res.status(403).json({ message: "Only the connected YouTube editor can clear the wheel." });
      }
      await redis.del("wheelEntries");
      // do NOT clear processedGiftIds so duplicates don't return from history
>>>>>>> 2cb884d (final)
      return res.status(200).json({ message: "Entries cleared" });
    } catch {
      return res.status(500).json({ message: "Failed to clear" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
