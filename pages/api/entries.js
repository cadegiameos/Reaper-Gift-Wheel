import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const entries = (await redis.get("wheelEntries")) || [];
      return res.status(200).json({ entries });
    } catch (e) {
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
    } catch (e) {
      return res.status(500).json({ message: "Failed to add" });
    }
  }

  if (req.method === "DELETE") {
    try {
      // Only allow clearing if:
      // 1) We have a refresh token (YouTube connected editor exists)
      // 2) The request carries the secure cookie set at OAuth callback
      const hasRefresh = !!(await redis.get("YT_REFRESH_TOKEN"));
      const cookieHeader = req.headers.cookie || "";
      const hasEditorCookie = cookieHeader.split(/;\s*/).some((c) => c.startsWith("yt_editor="));

      if (hasRefresh && !hasEditorCookie) {
        return res.status(403).json({ message: "Only the connected YouTube editor can clear the wheel." });
      }

      await redis.del("wheelEntries");
      return res.status(200).json({ message: "Entries cleared" });
    } catch (e) {
      return res.status(500).json({ message: "Failed to clear" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
