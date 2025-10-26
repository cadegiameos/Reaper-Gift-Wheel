// pages/api/youtube-gifts.js
import { google } from "googleapis";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  try {
    const access_token = await redis.get("yt_access_token");
    const channelId = await redis.get("yt_channel_id");

    if (!access_token) {
      return res.status(401).json({ message: "Not connected to YouTube" });
    }
    if (!channelId) {
      return res.status(400).json({ message: "No channel selected" });
    }

    const youtube = google.youtube({
      version: "v3",
      auth: access_token,
    });

    // Active broadcasts for the authed identity (can be the chosen Brand identity if selected on login)
    const broadcasts = await youtube.liveBroadcasts.list({
      part: "snippet",
      broadcastStatus: "active",
      maxResults: 50,
      mine: true,
    });

    const items = broadcasts.data.items || [];
    const activeForChosenChannel = items.find(
      (b) => b?.snippet?.channelId === channelId && b?.snippet?.liveChatId
    );

    if (!activeForChosenChannel) {
      return res.status(200).json({
        message: "No active live stream found for selected channel",
        added: 0,
        newEntries: [],
      });
    }

    const liveChatId = activeForChosenChannel.snippet.liveChatId;

    // Load chat messages
    const chat = await youtube.liveChatMessages.list({
      liveChatId,
      part: "snippet,authorDetails",
      maxResults: 200,
    });

    const messages = chat.data.items || [];
    let newEntries = [];

    // Dedupe by message ID
    const processedGiftIds = (await redis.get("processedGiftIds")) || [];

    for (const msg of messages) {
      const text = msg?.snippet?.displayMessage || "";
      const author = msg?.authorDetails?.displayName || "Unknown";
      const messageId = msg?.id;

      // Match “gifted 5 member(s)”
      const match = text.match(/gifted\s+(\d+)\s+member/i);
      if (match && messageId && !processedGiftIds.includes(messageId)) {
        const amount = parseInt(match[1], 10);
        if (amount > 0) {
          const existing = (await redis.get("wheelEntries")) || [];
          const updated = [...existing, ...Array(amount).fill(author)];
          await redis.set("wheelEntries", updated);

          processedGiftIds.push(messageId);
          newEntries.push({ name: author, amount });
        }
      }
    }

    // Keep last 500 processed IDs
    if (processedGiftIds.length > 500) {
      processedGiftIds.splice(0, processedGiftIds.length - 500);
    }
    await redis.set("processedGiftIds", processedGiftIds);

    return res.status(200).json({
      message: "Checked chat and added entries",
      added: newEntries.length,
      newEntries,
    });
  } catch (err) {
    console.error("youtube-gifts error:", err);
    return res
      .status(500)
      .json({ error: err.message, stack: err.stack || "No stack" });
  }
}
