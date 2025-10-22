import { google } from "googleapis";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  try {
    // ✅ 1) Check for YouTube token
    const access_token = await redis.get("yt_access_token");
    if (!access_token) {
      return res.status(200).json({
        connected: false,
        added: 0,
        details: [],
      });
    }

    // ✅ 2) Continue YouTube logic IF token exists
    const youtube = google.youtube({
      version: "v3",
      auth: access_token,
    });

    // 🟢 Get active live chat ID
    const broadcasts = await youtube.liveBroadcasts.list({
      part: "snippet",
      broadcastStatus: "active",
      mine: true,
    });

    if (!broadcasts.data.items?.length)
      return res
        .status(404)
        .json({ message: "No active live stream found" });

    const liveChatId = broadcasts.data.items[0].snippet.liveChatId;

    // 🟢 Get recent live chat messages
    const chat = await youtube.liveChatMessages.list({
      liveChatId,
      part: "snippet,authorDetails",
      maxResults: 200,
    });

    const messages = chat.data.items || [];

    // 🟢 Detect gifted membership messages
    let newEntries = [];
    for (const msg of messages) {
      const text = msg.snippet.displayMessage || "";
      const author = msg.authorDetails.displayName || "Unknown";

      // Match messages like: "John gifted 5 memberships!"
      const match = text.match(/gifted\s+(\d+)\s+member/i);
      if (match) {
        const amount = parseInt(match[1], 10);
        if (amount > 0) {
          const existing = (await redis.get("wheelEntries")) || [];
          const updated = [...existing, ...Array(amount).fill(author)];
          await redis.set("wheelEntries", updated);
          newEntries.push({ author, amount });
        }
      }
    }

    return res.status(200).json({
      connected: true,
      message: "Checked chat and added entries",
      added: newEntries.length,
      details: newEntries,
    });
  } catch (err) {
    console.error("YouTube gifts error:", err);
    return res
      .status(500)
      .json({ error: err.message, stack: err.stack || "No stack" });
  }
}
