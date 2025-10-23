import { google } from "googleapis";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  try {
    // ✅ Get stored access token & selected channel ID
    const accessToken = await redis.get("yt_access_token");
    const channelId = await redis.get("yt_channel_id");

    if (!accessToken || !channelId) {
      return res.status(401).json({ added: 0, message: "YouTube not fully connected" });
    }

    // ✅ Use the correct auth
    const youtube = google.youtube({
      version: "v3",
      auth: accessToken,
    });

    // ✅ Get ACTIVE live stream for the specific selected channel
    const broadcasts = await youtube.liveBroadcasts.list({
      part: "snippet",
      broadcastStatus: "active",
      broadcastType: "all",
      channelId, // 👈 ONLY check chosen channel
    });

    if (!broadcasts.data.items?.length) {
      return res.status(404).json({ added: 0, message: "No active live stream found" });
    }

    const liveChatId = broadcasts.data.items[0].snippet.liveChatId;

    // ✅ Fetch latest messages
    const chat = await youtube.liveChatMessages.list({
      liveChatId,
      part: "snippet,authorDetails",
      maxResults: 200,
    });

    const messages = chat.data.items || [];
    let totalAdded = 0;

    for (const msg of messages) {
      const text = msg.snippet.displayMessage || "";
      const author = msg.authorDetails.displayName || "Unknown";

      const match = text.match(/gifted\s+(\d+)\s+member/i);
      if (match) {
        const amount = parseInt(match[1], 10);
        if (amount > 0) {
          const existing = (await redis.get("wheelEntries")) || [];
          const newEntries = [...existing, ...Array(amount).fill(author)];
          await redis.set("wheelEntries", newEntries);
          totalAdded += amount;
        }
      }
    }

    return res.status(200).json({ added: totalAdded });
  } catch (err) {
    console.error("YouTube gifts error:", err);
    return res.status(500).json({ error: err.message });
  }
}
