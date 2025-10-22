import { google } from "googleapis";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// simple in-memory cache to prevent duplicates during short polling periods
let lastGiftIds = new Set();

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ message: "Method not allowed" });

  try {
    // Retrieve access token from Redis (set during OAuth)
    const token = await redis.get("yt_access_token");
    if (!token)
      return res.status(401).json({ message: "YouTube not connected" });

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: token });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    // Fetch liveChatId for the active broadcast
    const broadcasts = await youtube.liveBroadcasts.list({
      part: "snippet",
      broadcastStatus: "active",
    });

    if (!broadcasts.data.items.length)
      return res.status(200).json({ newEntries: [] });

    const liveChatId = broadcasts.data.items[0].snippet.liveChatId;

    // Fetch recent chat messages
    const messages = await youtube.liveChatMessages.list({
      liveChatId,
      part: "snippet,authorDetails",
      maxResults: 100,
    });

    const newEntries = [];

    for (const msg of messages.data.items) {
      const text = msg.snippet.displayMessage;
      const author = msg.authorDetails.displayName;
      const id = msg.id;

      if (lastGiftIds.has(id)) continue;

      // Detect gifted memberships
      const match = text.match(/(\d+)\s+gifted\s+membership/i);
      if (match) {
        const amount = parseInt(match[1], 10);
        newEntries.push({ name: author, amount });
        lastGiftIds.add(id);
      }
    }

    // Keep cache to a reasonable size
    if (lastGiftIds.size > 500) {
      lastGiftIds = new Set([...Array.from(lastGiftIds)].slice(-250));
    }

    res.status(200).json({ newEntries });
  } catch (err) {
    console.error("YouTube gifts API error:", err);
    res.status(500).json({ message: "YouTube fetch failed", error: err.message });
  }
}
