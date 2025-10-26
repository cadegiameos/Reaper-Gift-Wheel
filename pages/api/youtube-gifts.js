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

    // ✅ Initialize OAuth2 client with token
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token });

    // ✅ Use OAuth client instead of raw token
    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    });

    // ✅ Fetch active broadcasts from this account
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

    // ✅ Load chat messages
    const chat = await youtube.liveChatMessages.list({
      liveChatId,
      part: "snippet,authorDetails",
      maxResults: 200,
    });

    const messages = chat.data.items || [];
    let newEntries = [];

    // ✅ Load processed gift IDs to avoid duplicates
    const processedGiftIds = (await redis.get("processedGiftIds")) || [];

    for (const msg of messages) {
      const text = msg?.snippet?.displayMessage || "";
      const author = msg?.authorDetails?.displayName || "Unknown";
      const messageId = msg?.id;

      // ✅ Only match gift events
      const match = text.match(/gifted\s+(\d+)\s+member/i);
      if (match && messageId && !processedGiftIds.includes(messageId)) {
        const amount = parseInt(match[1], 10);
        if (amount > 0) {
          const existing = (await redis.get("wheelEntries")) || [];
          const updated = [...existing, ...Array(amount).fill(author)];
          await redis.set("wheelEntries", updated);

          // ✅ Store message ID as processed
          processedGiftIds.push(messageId);
          newEntries.push({ name: author, amount });
        }
      }
    }

    // ✅ Keep list from growing too big
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
