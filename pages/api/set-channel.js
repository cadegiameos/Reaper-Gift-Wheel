// pages/api/set-channel.js
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { channelId, channelTitle } = req.body || {};
    if (!channelId) {
      return res.status(400).json({ message: "Missing channelId" });
    }

    // ✅ Store chosen channel settings
    await redis.set("yt_channel_id", channelId);
    if (channelTitle) {
      await redis.set("yt_channel_title", channelTitle);
    }

    // ✅ Mark this browser session as the "editor" so it can clear wheel entries
    res.setHeader("Set-Cookie", [
      `yt_editor=1; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000` // 30 days
    ]);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("set-channel error:", err);
    return res.status(500).json({ message: "Error saving channel" });
  }
}
