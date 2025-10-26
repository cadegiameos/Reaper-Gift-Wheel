// pages/api/youtube-channels.js
import { google } from "googleapis";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  try {
    const access_token = await redis.get("yt_access_token");
    if (!access_token) {
      return res.status(401).json({ message: "Not connected to YouTube", channels: [] });
    }

    // Use OAuth token only (no API key)
    const youtube = google.youtube({
      version: "v3",
      auth: access_token,
    });

    // This returns channels owned by (or Brand Accounts selected by) the authed identity
    const resp = await youtube.channels.list({
      part: "snippet",
      mine: true,
      maxResults: 50,
    });

    const channels =
      (resp.data.items || []).map((ch) => ({
        id: ch.id,
        title: ch.snippet?.title || "Untitled",
        thumbnail:
          ch.snippet?.thumbnails?.default?.url ||
          ch.snippet?.thumbnails?.high?.url ||
          ch.snippet?.thumbnails?.medium?.url ||
          null,
      })) || [];

    return res.status(200).json({ channels });
  } catch (err) {
    console.error("youtube-channels error:", err);
    return res.status(500).json({ message: "Failed to load channels", channels: [] });
  }
}
