// pages/api/set-channel.js
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { channelId, channelTitle } = req.body || {};
  if (!channelId) {
    return res.status(400).json({ message: "Missing channelId" });
  }

  try {
    await redis.set("yt_channel_id", channelId);
    if (channelTitle) await redis.set("yt_channel_title", channelTitle);

    // mark this browser as the “editor” session that can clear the wheel
    res.setHeader("Set-Cookie", [
      `yt_editor=1; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`,
    ]);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Error saving channel:", err);
    return res.status(500).json({ message: "Error saving channel" });
  }
}
