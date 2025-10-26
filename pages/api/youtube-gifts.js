// pages/api/youtube-gifts.js
import { google } from "googleapis";
import { Redis } from "@upstash/redis";
import { getAuthedClient } from "./refresh-token";

const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(_req, res) {
  try {
    // Ensure we have a valid OAuth client (refresh token → access token)
    const { client, reason } = await getAuthedClient();
    if (!client) {
      return res.status(401).json({ message: "Owner not connected", reason });
    }

    const channelId = await redis.get("yt_channel_id");
    if (!channelId) {
      return res.status(400).json({ message: "Channel not configured" });
    }

    const youtube = google.youtube({ version: "v3", auth: client });

    // Find active broadcasts for the OWNER'S channel identity we saved
    const broadcasts = await youtube.liveBroadcasts.list({
      part: "snippet",
      broadcastStatus: "active",
      maxResults: 50,
      mine: true,
    });

    const items = broadcasts.data.items || [];
    const active = items.find(
      (b) => b?.snippet?.channelId === channelId && b?.snippet?.liveChatId
    );

    if (!active) {
      return res.status(200).json({
        message: "No active live stream found for configured channel",
        added: 0,
        newEntries: [],
      });
    }

    const liveChatId = active.snippet.liveChatId;

    // fetch latest chat messages
    const chat = await youtube.liveChatMessages.list({
      liveChatId,
      part: "snippet,authorDetails",
      maxResults: 200,
    });

    const messages = chat.data.items || [];
    const processedKey = `processedGiftIds:${liveChatId}`;
    const processedGiftIds = (await redis.get(processedKey)) || [];

    let newEntries = [];

    for (const msg of messages) {
      const text = msg?.snippet?.displayMessage || "";
      const author = msg?.authorDetails?.displayName || "Unknown";
      const id = msg?.id;

      // match "gifted 1 membership" / "gifted 5 memberships"
      const m = text.match(/gifted\s+(\d+)\s+member/i);
      if (!m || !id) continue;
      if (processedGiftIds.includes(id)) continue;

      const amount = parseInt(m[1], 10);
      if (amount > 0) {
        const existing = (await redis.get("wheelEntries")) || [];
        const updated = [...existing, ...Array(amount).fill(author)];
        await redis.set("wheelEntries", updated);

        processedGiftIds.push(id);
        newEntries.push({ name: author, amount });
      }
    }

    // keep last 500 id’s per-chat
    if (processedGiftIds.length > 500) {
      processedGiftIds.splice(0, processedGiftIds.length - 500);
    }
    await redis.set(processedKey, processedGiftIds);

    return res.status(200).json({
      message: "Checked chat and added entries",
      added: newEntries.length,
      newEntries,
    });
  } catch (err) {
    console.error("youtube-gifts error:", err?.response?.data || err);
    return res.status(500).json({ error: "Failed to read chat" });
  }
}
