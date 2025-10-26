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
      return res
        .status(401)
        .json({ message: "Not connected to YouTube", channels: [] });
    }

    const youtube = google.youtube({
      version: "v3",
      auth: access_token,
    });

    // ✅ Channels the user owns directly
    const ownedResp = await youtube.channels.list({
      part: "snippet",
      mine: true,
      maxResults: 50,
    });

    // ✅ Channels where the user has Editor / Manager access (Brand accounts)
    const managedResp = await youtube.channels.list({
      part: "snippet",
      managedByMe: true,
      maxResults: 50,
    });

    // ✅ Merge and remove duplicates
    const seen = new Set();
    const allChannels = [
      ...(ownedResp.data.items || []),
      ...(managedResp.data.items || []),
    ]
      .filter((ch) => {
        if (!ch?.id || seen.has(ch.id)) return false;
        seen.add(ch.id);
        return true;
      })
      .map((ch) => ({
        id: ch.id,
        title: ch.snippet?.title || "Untitled Channel",
        thumbnail:
          ch.snippet?.thumbnails?.high?.url ||
          ch.snippet?.thumbnails?.medium?.url ||
          ch.snippet?.thumbnails?.default?.url ||
          null,
      }));

    return res.status(200).json({ channels: allChannels });
  } catch (err) {
    console.error("youtube-channels error:", err);
    return res.status(500).json({
      message: "Failed to load channels",
      error: err.message,
      channels: [],
    });
  }
}
